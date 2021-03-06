/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import { withTestCodeEditor } from 'vs/editor/test/browser/testCodeEditor';
import { Position } from 'vs/editor/common/core/position';
import { Selection } from 'vs/editor/common/core/selection';
import { TextModel } from 'vs/editor/common/model/textModel';
import { LanguageConfigurationRegistry } from 'vs/editor/common/modes/languageConfigurationRegistry';
import { MockMode } from 'vs/editor/test/common/mocks/mockMode';
import { LanguageIdentifier } from 'vs/editor/common/modes';
import { BracketMatchingController } from 'vs/editor/contrib/bracketMatching/bracketMatching';

suite('bracket matching', () => {
	class BracketMode extends MockMode {

		private static readonly _id = new LanguageIdentifier('bracketMode', 3);

		constructor() {
			super(BracketMode._id);
			this._register(LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
				brackets: [
					['{', '}'],
					['[', ']'],
					['(', ')'],
				]
			}));
		}
	}

	test('issue #183: jump to matching bracket position', () => {
		let mode = new BracketMode();
		let model = TextModel.createFromString('var x = (3 + (5-7)) + ((5+3)+5);', undefined, mode.getLanguageIdentifier());

		withTestCodeEditor(null, { model: model }, (editor, cursor) => {
			let bracketMatchingController = editor.registerAndInstantiateContribution<BracketMatchingController>(BracketMatchingController);

			// start on closing bracket
			editor.setPosition(new Position(1, 20));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 9));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 19));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 9));

			// start on opening bracket
			editor.setPosition(new Position(1, 23));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 31));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 23));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 31));

			bracketMatchingController.dispose();
		});

		model.dispose();
		mode.dispose();
	});

	test('Jump to next bracket', () => {
		let mode = new BracketMode();
		let model = TextModel.createFromString('var x = (3 + (5-7)); y();', undefined, mode.getLanguageIdentifier());

		withTestCodeEditor(null, { model: model }, (editor, cursor) => {
			let bracketMatchingController = editor.registerAndInstantiateContribution<BracketMatchingController>(BracketMatchingController);

			// start position between brackets
			editor.setPosition(new Position(1, 16));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 18));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 14));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 18));

			// skip brackets in comments
			editor.setPosition(new Position(1, 21));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 23));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 24));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 23));

			// do not break if no brackets are available
			editor.setPosition(new Position(1, 26));
			bracketMatchingController.jumpToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 26));

			bracketMatchingController.dispose();
		});

		model.dispose();
		mode.dispose();
	});

	test('Select to next bracket', () => {
		let mode = new BracketMode();
		let model = TextModel.createFromString('var x = (3 + (5-7)); y();', undefined, mode.getLanguageIdentifier());

		withTestCodeEditor(null, { model: model }, (editor, cursor) => {
			let bracketMatchingController = editor.registerAndInstantiateContribution<BracketMatchingController>(BracketMatchingController);


			// start position in open brackets
			editor.setPosition(new Position(1, 9));
			bracketMatchingController.selectToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 20));
			assert.deepEqual(editor.getSelection(), new Selection(1, 9, 1, 20));

			// start position in close brackets
			editor.setPosition(new Position(1, 20));
			bracketMatchingController.selectToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 20));
			assert.deepEqual(editor.getSelection(), new Selection(1, 9, 1, 20));

			// start position between brackets
			editor.setPosition(new Position(1, 16));
			bracketMatchingController.selectToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 19));
			assert.deepEqual(editor.getSelection(), new Selection(1, 14, 1, 19));

			// start position outside brackets
			editor.setPosition(new Position(1, 21));
			bracketMatchingController.selectToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 25));
			assert.deepEqual(editor.getSelection(), new Selection(1, 23, 1, 25));

			// do not break if no brackets are available
			editor.setPosition(new Position(1, 26));
			bracketMatchingController.selectToBracket();
			assert.deepEqual(editor.getPosition(), new Position(1, 26));
			assert.deepEqual(editor.getSelection(), new Selection(1, 26, 1, 26));

			bracketMatchingController.dispose();
		});

		model.dispose();
		mode.dispose();
	});
});
