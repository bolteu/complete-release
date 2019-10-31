import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import fetch from 'node-fetch';

async function run() {
  try {
    if (!github.context.payload.issue) {
      throw {
        message: "This action can only be executed from PR or Issue"
      }
    } 
    let pullRequestApiUrl:string = github.context.payload.issue.pull_request.url;
    let pullRequestHtmlUrl:string = github.context.payload.issue.pull_request.base.repo.html_url;
    const githubApiToken:string | null = core.getInput('github-token');
    const githubUserName:string | null = core.getInput('github-user-name');
    const githubUserEmail:string | null = core.getInput('github-user-email');

    if (githubApiToken !== null) {
      pullRequestApiUrl = pullRequestApiUrl.replace("api.github.com", `${githubApiToken}@api.github.com`);
      pullRequestHtmlUrl = pullRequestHtmlUrl.replace("github.com", `${githubApiToken}@github.com`);
    }

    console.log(`Fetching PR info by url: ${pullRequestApiUrl}`);
    const pullRequest = await fetch(pullRequestApiUrl).then(data => data.json())

    console.log(`PR payload: \n ${JSON.stringify(pullRequest)}!`);

    const headRef:string = pullRequest.head.ref;
    const baseRef:string = pullRequest.base.ref;

    let myOutput = '';
    let myError = '';

    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          myOutput += data.toString();
        },
        stderr: (data: Buffer) => {
          myError += data.toString();
        }
      }
    }

    if (githubUserName) {
      await exec.exec('git', ['config', '--global', 'user.name', `"${githubUserName}"`]);
    }

    if (githubUserEmail) {
      await exec.exec('git', ['config', '--global', 'user.email', `"${githubUserName}"`]);
    }
    
    await exec.exec('git', ['checkout', '-B', baseRef]);
    await exec.exec('git', ['merge', `origin/${headRef}`, '--allow-unrelated-histories', '--strategy-option', 'theirs'], options);
    await exec.exec('git', ['push', pullRequestHtmlUrl])


    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();