'use strict';
import * as vscode from 'vscode';
import { ConfigurationTarget } from 'vscode';

const WORKBENCH_KEY = "workbench";
const COLOR_THEME_KEY = "colorTheme";
const WORKBENCH_THEME_KEY = WORKBENCH_KEY + "." + COLOR_THEME_KEY;
const EXTENSION_PREFIX = "themeSwitcher";

let _allInstalledThemes: any[];
let _currentIndexInAllInstalledThemes: number = -1;

let _themesListString: string;
let _themesListArray: string[];
let _currentSelectedThemeIndex = -1;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.workspace.onDidChangeConfiguration(loadSettings, this);

	loadSettings();
	loadAllThemes();

	vscode.commands.registerCommand(EXTENSION_PREFIX + '.nextSelectedTheme', () => {
		setNextSelectedTheme();
	});

	vscode.commands.registerCommand(EXTENSION_PREFIX + '.previousSelectedTheme', () => {
		setPreviousSelectedTheme();
	});

	vscode.commands.registerCommand(EXTENSION_PREFIX + '.nextTheme', () => {
		setPreviousTheme();
	});

	vscode.commands.registerCommand(EXTENSION_PREFIX + '.previousTheme', () => {
		setNextTheme();
	});

	context.subscriptions.push(disposable);
}

function loadAllThemes() {
	let installedThemes = vscode.extensions.all.filter(x => x.packageJSON.contributes && x.packageJSON.contributes.themes).map(x => x.packageJSON.contributes.themes);
	installedThemes = [].concat.apply([], installedThemes);
	const darkThemes = installedThemes.filter(x => x.uiTheme == "vs-dark");
	const lightThemes = installedThemes.filter(x => x.uiTheme == "vs");
	_allInstalledThemes = [...lightThemes, ...darkThemes];

	let currentTheme = vscode.workspace.getConfiguration().get(WORKBENCH_THEME_KEY);
	_currentIndexInAllInstalledThemes = _allInstalledThemes.map(x => x.id || x.label).indexOf(currentTheme.toString());
}

function loadSettings() {
	let extensionConfig = vscode.workspace.getConfiguration(EXTENSION_PREFIX);
	_themesListString = extensionConfig.themesList;
	_themesListArray = _themesListString.split(',').map(x => x.trim());

	let currentTheme = vscode.workspace.getConfiguration().get(WORKBENCH_THEME_KEY);
	_currentSelectedThemeIndex = _themesListArray.indexOf(currentTheme.toString());
}

function setNextTheme() {
	_currentIndexInAllInstalledThemes++;
	setThemeByIndex();
}

function setPreviousTheme() {
	_currentIndexInAllInstalledThemes--;
	setThemeByIndex();
}


function setNextSelectedTheme() {
	_currentSelectedThemeIndex++
	setSelectedThemeByIndex();
}

function setPreviousSelectedTheme() {
	_currentSelectedThemeIndex--
	setSelectedThemeByIndex();
}

function setThemeByIndex() {
	fixCurrentIndexInAllThemes();
	const themeName = _allInstalledThemes[_currentIndexInAllInstalledThemes];
	setThemeByName(themeName.id || themeName.label);
}

function fixCurrentIndexInAllThemes() {
	if (_currentIndexInAllInstalledThemes >= _allInstalledThemes.length) {
		_currentIndexInAllInstalledThemes = 0;
	}
	else
		if (_currentIndexInAllInstalledThemes < 0) {
			_currentIndexInAllInstalledThemes = _allInstalledThemes.length - 1;
		}
}

function fixCurrentSelectedIndex() {
	if (_currentSelectedThemeIndex >= _themesListArray.length) {
		_currentSelectedThemeIndex = 0;
	}
	else
		if (_currentSelectedThemeIndex < 0) {
			_currentSelectedThemeIndex = _themesListArray.length - 1;
		}
}

function setSelectedThemeByIndex() {
	fixCurrentSelectedIndex();
	const themeName = _themesListArray[_currentSelectedThemeIndex];
	setThemeByName(themeName);
}

function setThemeByName(themeName: string) {
	const confTarget = getConfigurationTarget();
	vscode.workspace.getConfiguration().update(WORKBENCH_THEME_KEY, themeName, confTarget);
}

function getConfigurationTarget(): ConfigurationTarget {
	const conf = vscode.workspace.getConfiguration(WORKBENCH_KEY);
	const info = conf.inspect(COLOR_THEME_KEY);
	let target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;
	if (info) {
		if (info.workspaceFolderValue) {
			target = vscode.ConfigurationTarget.WorkspaceFolder;
		} else if (info.workspaceValue) {
			target = vscode.ConfigurationTarget.Workspace;
		} else if (info.globalValue) {
			target = vscode.ConfigurationTarget.Global;
		} else if (info.defaultValue) {
			// setting not yet used: store setting in workspace
			if (vscode.workspace.workspaceFolders) {
				target = vscode.ConfigurationTarget.Workspace;
			}
		}
	}

	return target;
}
