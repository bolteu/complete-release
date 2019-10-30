import * as core from '@actions/core';
import github from '@actions/github';

async function run() {
  try {
    if (!github.context.payload.issue) {
      throw {
        message: "This action can only be executed from PR or Issue"
      }
    } 
    const pullRequestUrl:string = github.context.payload.issue.pull_request.url;

    const pullRequest = await fetch(pullRequestUrl)

    console.log(`PR payload: \n ${pullRequest}!`);

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();