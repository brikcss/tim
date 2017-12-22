#! /usr/bin/env node
/** ------------------------------------------------------------------------------------------------
 *  tim.js
 *  ------
 *  Tim "The Toolman" is brikcss's utility toolbelt. Your wish is his command.
 *  @author  brikcss  <https://github.com/brikcss>
 *  @todo  Convert helper log to module.
 ** --------------------------------------------------------------------------------------------- */

/**
 *  [[START]] Set up environment.
----------------------------------------------------------------------------------------------------
**/

// Parse cli arguments.
const tim = require('../lib/tim');
const cli = tim.minimist(process.argv.slice(1));
cli.command = cli._[1];
cli.cwd = process.cwd();

// aliases map single-key parameters with their long-form counterpart.
const aliases = {
	c: 'config',
	i: 'ignore',
	o: 'output',
	v: 'overwrite',
	w: 'watch',
	x: 'exports'
};
// Loop through cli args and normalize shortcuts to their long-form alias.
Object.keys(cli).forEach(arg => {
	// Set the cli option to the long form of the alias.
	if (aliases[arg] && cli[aliases[arg]] === undefined) {
		cli[aliases[arg]] = cli[arg];
	}
	// Remove the alias from the cli object.
	if (aliases[arg]) {
		delete cli[arg];
	}
});

/* [[END]] -------------------------------------------------------------------------------------- */

/**
 *  [[START]] Map commands to scripts.
----------------------------------------------------------------------------------------------------
**/

// cli.files is any argument that isn't an option. This has already been parsed by minimist.
cli.files = cli._.slice(2);

// Set up command-specific options.
if (cli.command === 'boot' && !cli.files) {
	help(cli, 'boot', `[!!] Uh oh... no [files] were specified.`);
	process.exit(1);
} else if (cli.command === 'help') {
	help(cli, cli.files[0]);
	process.exit(0);
}

if (cli.command === 'root') {
	// eslint-disable-next-line no-console
	console.log(tim.utils.getRoot(cli.files[0]));
} else if (tim[cli.command]) {
	// Run the script.
	tim[cli.command](cli);
} else {
	// If script doesn't exist, show help.
	help(cli, false, `\n[!!] Uh oh... \`${cli.command}\` is not a command Tim understands.`);
}

/* [[END]] -------------------------------------------------------------------------------------- */

/**
 *  [[START]] Helper functions.
----------------------------------------------------------------------------------------------------
**/

/**
 *  Logs help text to the console for tim commands.
 *
 *  @param   {object}  cli  Options / arguments from CLI.
 *  @param   {string}  command  Command to log help for. If not set, logs all help.
 *  @param   {string}  msg  Text to log at beginning.
 */
function help(cli, command, msg) {
	let helpText = '';
	const commandHelp = {
		help: `
    Details: Displays help for Tim, or for a particular command.
    Usage:   tim help [command]
             tim help boot
`,
		boot: `
    Details: Bootstraps a project and compiles templates to destination.
    Usage:   tim boot [files...] [options]
             tim boot ./my/files ./more/files --watch

    Options:
        --config, -c      Path to config file, if not cwd.
        --ignore, -i      Comma separated glob list of files to ignore.
        --output, -o      Output directory.
        --overwrite, -v   Overwrite destination files that exist.
        --watch, -w       Watch files and recompile when they change.
        --exports, -x.    File extension for exports files.
`
	};

	// eslint-disable-next-line no-console
	msg && console.log('\n' + msg);

	// Log the command-specific message, if command exists, or the default help text.
	if (command) {
		helpText += commandHelp[command];
	} else {
		helpText += `
TIM "THE TOOLMAN"
by brikcss <https://github.com/brikcss/tim>
-------------------------------------------
Tim is a front end utility toolbelt, build specifically for use with brikcss. The cli tool aims to be minimalistic, most configuration comes from config files (\`.brikcssrc.js\` and/or \`.brikrc.js\`). For full documentation, see https://github.com/brikcss/tim.

Usage: tim <command> [files...] [options]

    COMMANDS
    --------`;
		Object.keys(commandHelp).forEach(cmd => (helpText += `\n    Command: ${cmd}` + commandHelp[cmd]));
	}
	// eslint-disable-next-line no-console
	console.log(helpText);
}
/* [[END]] -------------------------------------------------------------------------------------- */
