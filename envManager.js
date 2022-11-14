const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({input: process.stdin, output: process.stdout });

/*
  Show differences between .env and .env.dist files
  Author: Ignacio Aguirre.
  https://github.com/nachoaguirre/node-env-manager
*/
let parseResult;

const config = {
  envFolder: '/path/to/folder/with/dotenv', // Set the path to the folder where the .env and .env.dist files are located
  showBanner: true,
  // Set the environments you want to use for the switch environment option.
  // The key is the name of the environment and the value is an object with the variables and values you want to change
  environments: {
    'staging': {
      'KEY_NAME1': 'value for staging',
      'KEY_NAME2': 'value for staging',
      'KEY_NAME3': 'value for staging',
      'KEY_NAME4': 'another value for staging',
      'KEY_NAME5': 'the same value in staging and production',
    },
    'production': {
      'KEY_NAME1': 'value for production',
      'KEY_NAME2': 'value for production',
      'KEY_NAME3': 'value for production',
      'KEY_NAME4': 'and another value for production environment',
      'KEY_NAME5': 'the same value in staging and production',
    }
  }
};

let colors = {
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  italic: '\u001b[3m',
  underline: '\u001b[4m',
  inverse: '\u001b[7m',
  hidden: '\u001b[8m',
  strikethrough: '\u001b[9m',
}

let banner = () => {
  process.stdout.write(`
  ███████╗███╗   ██╗██╗   ██╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗
  ██╔════╝████╗  ██║██║   ██║    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗
  █████╗  ██╔██╗ ██║██║   ██║    ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝
  ██╔══╝  ██║╚██╗██║╚██╗ ██╔╝    ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗
  ███████╗██║ ╚████║ ╚████╔╝     ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║
  ╚══════╝╚═╝  ╚═══╝  ╚═══╝      ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                                                          v1.0\n\n`);
}

let checkFolder = () => {
  let path = config.envFolder;

  if(!path) {
    process.stdout.write(`${colors.red}${colors.bold}ERROR:${colors.reset} You need to set the envFolder in the config object...\n`);
    return false;
  }

  if (!fs.existsSync(path)) {
    process.stdout.write(`${colors.red}${colors.bold}ERROR:${colors.reset} The folder ${path} does not exist...\n`);
    return false;
  }

  if(path.substr(-1) != '/') {
    path = path + '/';
    config.envFolder = path;
  }

  if(!fs.existsSync(path + '.env')) {
    process.stdout.write(`${colors.red}${colors.bold}ERROR:${colors.reset} The file ${path}.env does not exist...\n`);
    return false;
  }

  if(!fs.existsSync(path + '.env.dist')) {
    process.stdout.write(`${colors.red}${colors.bold}ERROR:${colors.reset} The file ${path}.env.dist does not exist...\n`);
    return false;
  }

  return true;
}

let showMenu = () => {
  let differences = parseResult.differences || [];

  let menuQuestions = `
    MAIN MENU
    ----------
    ${colors.bold}What do you want to do?${colors.reset}
    1️⃣. View differences between .env and .env.dist files
    2️⃣. Import new variables from .env.dist to .env
    3️⃣. Change variable values according to environment
    4️⃣. Quit

    > Enter the number of the option you want to execute: 👉 `;

  rl.question(menuQuestions, function (action) {
    if(action == 1) { showDifferences(differences); }
    else if(action == 2) { showImportMenu(); }
    else if(action == 3) { showSwitchEnvironmentMenu(); }
    else if(action == 4) { rl.close(); }
    else {
      process.stdout.write(`    ${colors.red}Ups!${colors.reset} Invalid option, write your choice as a number (1, 2, 3, 4)...\n`);
      showMenu();
    }
    showEndMenu();
  });
}

let showImportMenu = () => {
  let news = parseResult.news || [];
  let newsCount = Object.keys(news).length;

  if(newsCount == 0) {
    process.stdout.write(`    ${colors.yellow}There are no new variables to import...${colors.reset}\n`);
    showMenu();
    return;
  } else {
    let menuQuestions = `

    IMPORT MENU
    ------------
    There are ${colors.yellow}${Object.keys(news).length}${colors.reset} new variables in the .env.dist file, what do you want to do?${colors.reset}
    1️⃣. See list with the variables to import
    2️⃣. Import all new variables
    3️⃣. Back to Main Menu
    4️⃣. Quit

    > Enter the number of the option you want to execute: 👉 `;

    rl.question(menuQuestions, function (action) {
      if(action == 1) { showNewVariables(news); }
      else if(action == 2) { importNewVariables(news); }
      else if(action == 3) { showMenu(parseResult); }
      else if(action == 4) { rl.close(); }
      else {
        process.stdout.write(`${colors.red}Ups!${colors.reset} Invalid option, write your choice as a number (1, 2, 3, 4)...\n`);
        showEndImportMenu();
      }
      showEndImportMenu();
    });
  }
}

let showSwitchEnvironmentMenu = () => {
  let environments = config.environments || [];

  let environmentsCount = Object.keys(environments).length;
  let environmentsOptions = ``;
  let i = 1;
  for(let env in environments) {
    environmentsOptions += `
      ${i}. Switch values to "${env}" environment`;
    i++;
  }
  environmentsOptions += `
      ${i}. Back to Main Menu`;
  i++;
  environmentsOptions += `
      ${i}. Quit`;

  let menuQuestions = `

    SWITCH ENVIRONMENT MENU
    ------------------------
    There are ${colors.yellow}${environmentsCount}${colors.reset} environments defines in the config object, what do you want to do?
    ${environmentsOptions}

    > Enter the number of the option you want to execute: 👉 `;

    rl.question(menuQuestions, function (action) {
      if(action > 0 && action <= environmentsCount) {
        let env = Object.keys(environments)[action - 1];
        switchEnvironment(env, environments[env]);
      }
      else if(action == environmentsCount + 1) { showMenu(parseResult); }
      else if(action == environmentsCount + 2) { rl.close(); }
      else {
        process.stdout.write(`${colors.red}Ups!${colors.reset} Invalid option, write your choice as a number (1, 2, 3, 4)...\n`);
        showEndMenu();
      }
      showEndMenu();
    });
}


let showEndImportMenu = () => {
  let menuQuestions = `
    ACTION COMPLETED MENU
    ----------------------
    ${colors.bold}... What would you like to do now?${colors.reset}
    1️⃣. Back to the main menu
    2️⃣. Back to import menu
    3️⃣. Quit

  > Enter the number of the option you want to execute: 👉 `;

  rl.question(menuQuestions, function (action) {
    if(action == 1) { showMenu(); }
    else if(action == 2) { showImportMenu(); }
    else if(action == 3) { rl.close(); }
    else { rl.close(); }
  });
}

let showEndMenu = () => {
  let menuQuestions = `
    ACTION COMPLETED MENU
    ----------------------
    ${colors.bold}... What would you like to do now?${colors.reset}
    1️⃣. Back to the main menu
    2️⃣. Quit

  > Enter the number of the option you want to execute: 👉 `;

  rl.question(menuQuestions, function (action) {
    if(action == 1) { showMenu(); }
    else if(action == 2) { rl.close(); }
    else { rl.close(); }
  });
}

rl.on('close', function () {
  console.log('\nBYE BYE !!!');
  process.exit(0);
});

let init = () => {
  if (config.showBanner) banner();
  let checkFolderStatus = checkFolder();
  console.log(`Checking configuration status...`);
  console.log(`Correct configuration: `, checkFolderStatus);
  if(!checkFolderStatus) return;

  parseResult = parseAndCompareEnvs();
  showMenu(parseResult);
}

let showDifferences = (differences) => {
  if(Object.keys(differences).length > 0) {
    process.stdout.write(`\n\n ${colors.magenta}${colors.bold}[DIFFERENCES]${colors.reset} ------------------------------ \n`);
    let differencesWithDefault = [];
    for(let key in differences) {
      differencesWithDefault[key] = {'Default Value': getEnvDistValue(key), 'Your Value': differences[key]};
    }
    console.table(differencesWithDefault);
    process.stdout.write(`\n\n ${colors.magenta}[DIFFERENCES]${colors.reset} ${colors.yellow}${colors.bold}${Object.keys(differences).length}${colors.reset} differences found between files \n`);
    process.stdout.write(`-------------------- 🌟 -------------------- \n\n`);
  } else {
    process.stdout.write(`\n\n ${colors.magenta}[DIFFERENCES]${colors.reset} No differences were found in .env.dist compared to you .env file... \n`);
    process.stdout.write(`-------------------- 🌟 -------------------- \n\n`);
  }
}

let showNewVariables = (news) => {
  let amount = Object.keys(news).length;

  if(amount > 0) {
    process.stdout.write(`\n\n ${colors.magenta}${colors.bold}[NEW VARIABLES]${colors.reset} ------------------------------ \n`);
    let newsArray = [];
    for(let key in news) { newsArray[key] = {'Value': getEnvDistValue(key)}; }
    console.table(newsArray);
    process.stdout.write(`\n\n ${colors.magenta}${colors.bold}[NEW VARIABLES]${colors.reset} ${colors.yellow}${colors.bold}${amount}${colors.reset} new variables found \n`);
    process.stdout.write(`-------------------- 🌟 -------------------- `);
  } else {
    process.stdout.write(`\n\n ${colors.magenta}${colors.bold}[NEW VARIABLES]${colors.reset} No differences were found in .env.dist compared to you .env file...\n`);
    process.stdout.write(`-------------------- 🌟 -------------------- `);
  }
}

let importNewVariables = (news) => {
  let amount = Object.keys(news).length;
  if(amount > 0) {
    process.stdout.write(`\n\n${colors.magenta}[IMPORT NEW VARIABLES STARTED]${colors.reset} \n`);
    let current = 1;

    d = new Date();
    let pad = (n) => {return n<10 ? '0'+n : n}
    let datetimeFile = `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} @ ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    writeEnvValue(`### AUTO IMPORTED ON ${datetimeFile} `, ' ###');

    for(let key  in news){
      if(current <= amount) {
        process.stdout.write(`[${current}/${amount}] Adding key ${key} with value ${news[key]} \n`);
        writeEnvValue(key, news[key]);
        current++;
      }
    }
    parseResult = parseAndCompareEnvs();
    process.stdout.write(`\n${colors.magenta}${colors.bold}[IMPORT NEW VARIABLES COMPLETED]${colors.reset} 🎉 ${colors.yellow}${colors.bold}${amount}${colors.reset} variables were added to your .env file... \n`);
  } else {
    process.stdout.write(`\n${colors.magenta}[IMPORT NEW VARIABLES]${colors.reset} No new variables were found in .env.dist compared to you .env file... Nothing to import, keep going ✅ \n\n`);
  }
}


let updateVariables = (variables) => {
  let amount = Object.keys(variables).length;
  if(amount > 0) {
    process.stdout.write(`\n\n${colors.magenta}[UPDATE VARIABLES STARTED]${colors.reset} \n`);
    let current = 1;

    d = new Date();
    let pad = (n) => {return n<10 ? '0'+n : n}
    let datetimeFile = `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} @ ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    for(let key  in variables){
      if(current <= amount) {
        process.stdout.write(`[${current}/${amount}] Adding key ${key} with value ${variables[key]} \n`);
        writeEnvValue(key, variables[key]);
        current++;
      }
    }
    parseResult = parseAndCompareEnvs();
    process.stdout.write(`\n${colors.magenta}${colors.bold}[UPDATE VARIABLES COMPLETED]${colors.reset} 🎉 ${colors.yellow}${colors.bold}${amount}${colors.reset} variables were updated in your .env file... \n`);
  } else {
    process.stdout.write(`\n${colors.magenta}[UPDATE VARIABLES]${colors.reset} No variables were updated in your .env file...\n\n`);
  }
}

var parseAndCompareEnvs = () => {
  let envFile = fs.readFileSync(config.envFolder+'.env', 'utf-8').split('\n');
  let envDistFile = fs.readFileSync(config.envFolder+'.env.dist', 'utf-8').split('\n');

  let envObj = {};
  let envDistObj = {};

  for (const line of envFile) {
    if (line.startsWith('#') || line == '') continue;
    let [key, value] = line.split('=');
    envObj[key] = value;
  }

  for (const line of envDistFile) {
    if (line.startsWith('#') || line == '') continue;
    let [key, value] = line.split('=');
    envDistObj[key] = value;
  }

  let equals = {};
  let differences = {};
  let news = {};

  let getDifferences = checkDiff(envDistObj, envObj);

  for (var key in envDistObj) {
    if(Object.is(envDistObj[key], envObj[key])) { equals[key] = envDistObj[key]; }
    else if(getDifferences != 'equals') {
      if(getDifferences[key] === undefined) { news[key] = envDistObj[key]; }
      else { differences[key] = envObj[key]; equals[key] = envDistObj[key]; }
    }
  }

  return { differences: differences, news: news};
}

function checkDiff(o1,o2) {
  const typeObject = function(o){ return typeof o === 'object'; };
  const check = function(o1, o2) {
    const result = {};
    if (!typeObject(o1) && typeObject(o2)) { return o2; }
    else if (typeObject(o1) && !typeObject(o2)) { return o1; }
    else if (Object.is(o1, o2)) { return 'equals'; }

    const keys = Object.keys(o1);

    for (let i=0; i<keys.length; i++) {
      const key = keys[i];
      if ( typeObject(o1[key]) && typeObject(o2[key])) {
        if ( Object.is(o1[key], o2[key]) ) { /* empty */ }
        else if (o1[key] === o2[key]) { /* empty */ }
        else { result[key] = checkDiff(o1[key],o2[key]); }
      }
      else if (o1[key] !== o2[key]) { result[key] = o2[key]; }
      else { /* empty */ }
    }

    return result;
  };
  return check(o1,o2);
}

let writeEnvValue = (key, value) => {
  const envVars = fs.readFileSync(config.envFolder+'.env', 'utf-8').split('\n');
  const targetLine = envVars.find((line) => line.split('=')[0] === key);
  if (targetLine !== undefined) {
    const targetLineIndex = envVars.indexOf(targetLine);
    envVars.splice(targetLineIndex, 1, `${key}=${value}`);
  } else { envVars.push(`${key}=${value}`); }
  fs.writeFileSync(config.envFolder+'.env', envVars.join('\n'));
};

let getEnvValue = (key) => {
  const envVars = fs.readFileSync(config.envFolder+'.env', 'utf-8').split('\n');
  const targetLine = envVars.find((line) => line.split('=')[0] === key);
  if (targetLine !== undefined) { return targetLine.split('=')[1]; }
  return undefined;
};

let getEnvDistValue = (key) => {
  const envVars = fs.readFileSync(config.envFolder+'.env.dist', 'utf-8').split('\n');
  const targetLine = envVars.find((line) => line.split('=')[0] === key);
  if (targetLine !== undefined) { return targetLine.split('=')[1]; }
  return undefined;
};

let switchEnvironment = (environment, variables) => {
  process.stdout.write(`\n\n${colors.bold}[SWITCH ENVIRONMENT]${colors.reset} \n`);

  let equalsWithCurrent = [];
  let differencesWithCurrent = [];
  let newsWithCurrent = [];

  let differencesWithCurrentArr = [];
  let newsWithCurrentArr = [];

  for(let key in variables) {
    let current = getEnvValue(key);
    if(current == undefined) { newsWithCurrent[key] = {'New Value to Add': variables[key]}; newsWithCurrentArr[key] = variables[key]; }
    else if(current != variables[key]) { differencesWithCurrent[key] = {'Current Value': current, 'New Value': variables[key]}; differencesWithCurrentArr[key] = variables[key]; }
    else { equalsWithCurrent[key] = {'Current Value': current, 'New Value': variables[key]}; }
  }

  let equalsWithCurrentCount = Object.keys(equalsWithCurrent).length;
  let differencesWithCurrentCount = Object.keys(differencesWithCurrent).length;
  let newsWithCurrentCount = Object.keys(newsWithCurrent).length;

  if(equalsWithCurrentCount == 0 && differencesWithCurrentCount == 0 && newsWithCurrentCount == 0) {
    process.stdout.write(`    ${colors.yellow}There are no variables to switch in the ${environment} environment...${colors.reset}\n`);
    showEndMenu();
  }
  else {
    if(equalsWithCurrentCount > 0) {
      process.stdout.write(`${colors.magenta}[VARIABLES WITHOUT CHANGE]${colors.reset} ------------------------------ \n`);
      process.stdout.write(`The following variables will remain with the same value \n`);
      console.table(equalsWithCurrent);
    }

    if(newsWithCurrentCount > 0) {
      process.stdout.write(`${colors.magenta}[NEW VARIABLES TO ADD]${colors.reset} ------------------------------ \n`);
      process.stdout.write(`The following variables will be added, since they are not present in your .env fuke \n`);
      console.table(newsWithCurrent);
    }

    process.stdout.write(`${colors.magenta}[VARIABLES TO UPDATE]${colors.reset} ------------------------------ \n`);
    if(differencesWithCurrentCount > 0) {
      process.stdout.write(`You are going to change the following variables, setting values from ${environment} environment \n`);
      console.table(differencesWithCurrent);
    } else {
      process.stdout.write(`No variables to update with different or new values from ${environment} environment \n`);
    }

    let menuQuestions = `
      CONFIRM SWITCH ENVIRONMENT
      ----------------------
      ${colors.bold}... Would you like to continue?${colors.reset}
      1️⃣. Yes, switch values from ${environment} environment
      2️⃣. No, Back to Main Menu
      3️⃣. Quit

    > Enter the number of the option you want to execute: 👉 `;

    rl.question(menuQuestions, function (action) {
      if(action == 1) {
        if(Object.keys(newsWithCurrent).length > 0) { importNewVariables(newsWithCurrentArr); }
        if(Object.keys(differencesWithCurrent).length > 0) { updateVariables(differencesWithCurrentArr); }
      }
      else if(action == 2) { showMenu(); }
      else if(action == 3) { rl.close(); }
      else { rl.close(); }
      showMenu();
    });
  }
}

init();
