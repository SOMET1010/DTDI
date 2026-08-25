'use strict';

// Minimal GitHub REST client built on the native fetch (Node 22+).
// No SDK dependency: the cockpit only ever needs a handful of read
// endpoints, and keeping this hand-written makes the request shape
// (and the fact that the token never leaves the server process)
// trivial to audit.
//
// Section 32: the token is passed in by the caller (read from an
// environment variable at the process boundary in src/index.js) and is
// never logged, never serialized into an API response, and never sent
// to the frontend.

const GITHUB_API = 'https://api.github.com';

function createGithubClient({ token, fetchImpl = fetch, baseUrl = GITHUB_API } = {}) {
  async function request(pathname, { method = 'GET' } = {}) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'pass-ai-orchestrator-cockpit',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetchImpl(`${baseUrl}${pathname}`, { method, headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`GitHub API ${method} ${pathname} -> ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  }

  return {
    getRepo(owner, repo) {
      return request(`/repos/${owner}/${repo}`);
    },
    getPullRequest(owner, repo, prNumber) {
      return request(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    },
    listPullRequests(owner, repo, { state = 'open' } = {}) {
      return request(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`);
    },
    listIssueComments(owner, repo, prNumber) {
      return request(`/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`);
    },
    listWorkflowRunsForCommit(owner, repo, headSha) {
      return request(`/repos/${owner}/${repo}/actions/runs?head_sha=${headSha}&per_page=20`);
    },
    getWorkflowRun(owner, repo, runId) {
      return request(`/repos/${owner}/${repo}/actions/runs/${runId}`);
    },
    listJobsForWorkflowRun(owner, repo, runId) {
      return request(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=50`);
    },
    listArtifactsForWorkflowRun(owner, repo, runId) {
      return request(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=50`);
    },
    // Binary download (a zip), not JSON — GitHub replies with a redirect
    // to a signed blob URL, which fetch follows automatically.
    async downloadArtifactZip(owner, repo, artifactId) {
      const headers = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'pass-ai-orchestrator-cockpit',
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetchImpl(`${baseUrl}/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`, { headers });
      if (!res.ok) {
        const err = new Error(`GitHub API GET artifact zip ${artifactId} -> ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },
  };
}

module.exports = { createGithubClient, GITHUB_API };
