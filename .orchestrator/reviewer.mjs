import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

for (const key of ['OPENAI_API_KEY','GITHUB_REPOSITORY','GITHUB_EVENT_PATH']) if (!process.env[key]) throw new Error(`Missing env ${key}`);
const model = process.env.OPENAI_REVIEW_MODEL || 'gpt-5.6';
const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr) throw new Error('pull_request event required');
const base = pr.base.sha, head = pr.head.sha;
const runId = `${process.env.GITHUB_REPOSITORY}#${pr.number}@${head.slice(0,12)}`;
const git = args => execFileSync('git', args, {encoding:'utf8', maxBuffer:20*1024*1024});
const changedFiles = git(['diff','--name-status',`${base}...${head}`]);
const diffStat = git(['diff','--stat',`${base}...${head}`]);
let diff = git(['diff','--unified=3',`${base}...${head}`]);
if (diff.length > 180000) diff = diff.slice(0,180000)+'\n[DIFF TRUNCATED]\n';
const doctrine = fs.readFileSync('.orchestrator/PASS_ACADEMY_REVIEW_CONTRACT.md','utf8');
const testSummary = fs.readFileSync('.orchestrator/runtime/test-summary.txt','utf8');
const schema={type:'object',additionalProperties:false,required:['protocol_version','project','run_id','review_verdict','summary','findings','non_blocking_reservations','not_verified','next_action'],properties:{protocol_version:{type:'string'},project:{type:'string'},run_id:{type:'string'},review_verdict:{type:'string',enum:['GO','GO_WITH_RESERVATIONS','NOK','BLOCKED','NOT_VERIFIED']},summary:{type:'string'},findings:{type:'array',items:{type:'object',additionalProperties:false,required:['id','severity','status','finding','location','evidence','required_fix','must_preserve','revalidation'],properties:{id:{type:'string'},severity:{type:'string',enum:['CRITICAL','MAJOR','MINOR']},status:{type:'string',enum:['FAIL','RESERVATION','NOT_VERIFIED']},finding:{type:'string'},location:{type:'string'},evidence:{type:'array',items:{type:'string'}},required_fix:{type:'string'},must_preserve:{type:'array',items:{type:'string'}},revalidation:{type:'array',items:{type:'string'}}}}},non_blocking_reservations:{type:'array',items:{type:'string'}},not_verified:{type:'array',items:{type:'string'}},next_action:{type:'string',enum:['PROCEED','CORRECT_AND_RESUBMIT','REQUEST_HUMAN_ARBITRATION','PROVIDE_MISSING_EVIDENCE','STOP_SECURITY_REVIEW']}}};
const input=`You are the independent QA/review agent for PASS Academy. Return only the requested JSON.\n\nPROJECT CONTRACT:\n${doctrine}\n\nPR #${pr.number}: ${pr.title}\nMISSION:\n${pr.body||'(no description)'}\nBASE:${base}\nHEAD:${head}\nRUN_ID:${runId}\n\nCHANGED FILES:\n${changedFiles}\nDIFF STAT:\n${diffStat}\nAUTOMATED CHECKS:\n${testSummary}\nDIFF:\n${diff}\n\nEvidence before assertion. Absence of proof is NOT_VERIFIED, never PASS. Do not invent device or field evidence. Flag unauthorized doctrine/scope changes. Mandatory failure => NOK/CORRECT_AND_RESUBMIT. Security, destructive, sensitive-data, real-money or major-scope ambiguity => human arbitration/security review.`;
const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,reasoning:{effort:'medium'},input,text:{format:{type:'json_schema',name:'pass_academy_review',strict:true,schema}}})});
if(!response.ok) throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
const data=await response.json();
const outputText=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
if(!outputText) throw new Error('No structured review output returned');
const review=JSON.parse(outputText);
fs.mkdirSync('.orchestrator/runtime',{recursive:true});
let priorNok=0;
if(process.env.GITHUB_TOKEN){const r=await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${pr.number}/comments?per_page=100`,{headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','User-Agent':'pass-ai-orchestrator'}});if(r.ok){const cs=await r.json();priorNok=cs.filter(c=>c.body?.includes('<!-- PASS-AI-REVIEW')&&c.body?.includes('ChatGPT QA — NOK')).length;}}
if(review.next_action==='CORRECT_AND_RESUBMIT'&&priorNok>=2){review.review_verdict='BLOCKED';review.next_action='REQUEST_HUMAN_ARBITRATION';review.summary=`Escalade humaine après ${priorNok} cycles NOK automatiques. ${review.summary}`;}
fs.writeFileSync('.orchestrator/runtime/review.json',JSON.stringify(review,null,2)+'\n');
const lines=[`<!-- PASS-AI-REVIEW run=${runId} -->`,`## ChatGPT QA — ${review.review_verdict}`,'',review.summary,'',...review.findings.flatMap(f=>[`### ${f.id} — ${f.severity} — ${f.status}`,f.finding,f.location?`**Localisation:** ${f.location}`:'',f.evidence?.length?`**Preuves:** ${f.evidence.join(' | ')}`:'',`**Correction demandée:** ${f.required_fix}`,`**À préserver:** ${f.must_preserve.join(' | ')}`,`**Revalidation:** ${f.revalidation.join(' | ')}`,'']),review.not_verified?.length?`**Non vérifié:** ${review.not_verified.join(' | ')}`:'','',`**Action:** ${review.next_action}`].filter(Boolean);
const needsClaude=review.next_action==='CORRECT_AND_RESUBMIT';
if(needsClaude) lines.push('','@claude Correction automatique demandée sur les seuls constats NOK ci-dessus.');
fs.writeFileSync('.orchestrator/runtime/review-comment.md',lines.join('\n')+'\n');
const claudePrompt=needsClaude?`You are the PASS Academy implementation agent. Fix ONLY the independent reviewer findings below on the current PR branch. Preserve doctrine and invariants. Do not broaden scope, deploy/release, delete data, alter sensitive/security behavior or real-money behavior. Run requested tests and push the correction to this PR branch.\n\n${lines.join('\n')}`:'';
fs.writeFileSync('.orchestrator/runtime/claude-fix-prompt.md',claudePrompt+'\n');
if(process.env.GITHUB_OUTPUT){fs.appendFileSync(process.env.GITHUB_OUTPUT,`verdict=${review.review_verdict}\nnext_action=${review.next_action}\nneeds_claude=${needsClaude}\n`);if(claudePrompt){const m=`PROMPT_${Date.now()}`;fs.appendFileSync(process.env.GITHUB_OUTPUT,`claude_prompt<<${m}\n${claudePrompt}\n${m}\n`);}}
console.log(JSON.stringify({verdict:review.review_verdict,next_action:review.next_action,needsClaude}));
