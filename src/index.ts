import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';

async function run() {
  try {
    if (!github.context.payload.issue) {
      throw {
        message: "This action can only be executed from PR or Issue"
      }
    } 
    const pullRequestUrl:string = github.context.payload.issue.pull_request.url;

    console.log(`Fetching PR info by url: ${pullRequestUrl}`);
    const pullRequest = await fetch(pullRequestUrl).then(data => data.json())

    console.log(`PR payload: \n ${JSON.stringify(pullRequest)}!`);

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();