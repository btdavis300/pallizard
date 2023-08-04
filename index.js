#!/usr/bin/env node
import chalk from "chalk"; // Terminal string styling done right
import inquirer from "inquirer"; // A collection of common interactive command line user interfaces.
import fs from "fs"; // Node.js file system module
import * as child from "child_process";

let urlPaths = [];
let reporterName = "";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
const sleepShort = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
  const welcomeMessage = console.log(
    chalk.yellow("Welcome to the pa11y-ci configuration wizard!")
  );

  await sleep();
}

async function installPa11y() {
  console.log(chalk.blue("Installing pa11y-ci..."));
  child.exec("npm install -g pa11y pa11y-ci", () => {
    console.log(chalk.green("pa11y-ci installed!"));
  });

  await sleepShort();
}

async function reporter() {
  const reporter = await inquirer.prompt({
    name: "reporter_name",
    type: "input",
    message: "Enter reporter file name:",
    default() {
      return "reporter";
    },
  });

  reporterName = `./${reporter.reporter_name}.json`;

  await review();
}

async function review() {
  console.log("URL Paths:\n" + chalk.blue(urlPaths.map((url) => `${url}\n`)));
  console.log(
    "Reporter File Name:\n " + chalk.green(reporterName.replace("./", ""))
  );

  await sleep();

  const audit = await inquirer.prompt({
    name: "run_audit",
    type: "list",
    message: "Run audit?\n",
    choices: ["Yes", "No"],
  });

  if (audit.run_audit === "Yes") {
    await runAudit();
  } else {
    console.log(chalk.red("Goodbye!"));
  }
}

async function url() {
  const URL = await inquirer.prompt({
    name: "url_path",
    type: "input",
    message: "Enter url to add to audit:",
    default() {
      return "URL";
    },
  });

  urlPaths = [...urlPaths, URL.url_path];
}

async function addURL() {
  const prompt = await inquirer.prompt({
    name: "add_url",
    type: "list",
    message: "Add URL?\n",
    choices: ["Yes", "No"],
  });

  if (prompt.add_url === "Yes") {
    await url();
    await addURL();
  } else {
    await reporter();
  }
}

async function runAudit() {
  let response = {
    urls: urlPaths,
    defaults: {
      standard: "WCAG2AAA",
      reporters: [["json", { fileName: reporterName }]],
    },
  };
  fs.writeFileSync("pa11y-ci.json", JSON.stringify(response));
  fs.closeSync(fs.openSync(reporterName, "w"));

  child.exec("pa11y-ci -c ./pa11y-ci.json", () => {
    successMessage();
  });
}

function successMessage() {
  console.log(chalk.blue("pa11y-ci.json file created!"));
  console.log(chalk.blue(`${reporterName.replace("./", "")} file created!`));
  console.log(chalk.green("Audit Complete. \nGoodbye!"));
}

// Run function with top-level await
await welcome();
await installPa11y();
await url();
await addURL();
