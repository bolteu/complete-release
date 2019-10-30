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
    let pullRequestUrl:string = github.context.payload.issue.pull_request.url;
    const githubApiToken:string | null = core.getInput('github-token');

    if (githubApiToken !== null) {
      pullRequestUrl = pullRequestUrl.replace("api.github.com", `${githubApiToken}@api.github.com`);
    }

    console.log(`Fetching PR info by url: ${pullRequestUrl}`);
    const pullRequest = await fetch(pullRequestUrl).then(data => data.json())

    console.log(`PR payload: \n ${JSON.stringify(pullRequest)}!`);

    const headRef:string = pullRequest.head.ref;
    const baseRef:string = pullRequest.base.ref;

    let myOutput = '';
    let myError = '';

    const options:any = {};
    options.listeners = {
      stdout: (data: Buffer) => {
        myOutput += data.toString();
      },
      stderr: (data: Buffer) => {
        myError += data.toString();
      }
    };
    await exec.exec('git', ['merge', `origin/${headRef}`, '--allow-unrelated-histories', '--strategy-option', 'theirs'], options);


    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();