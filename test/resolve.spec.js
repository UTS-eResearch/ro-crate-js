/* This is part of rocrate-js a node library for implementing the RO-Crate data
packaging spec. Copyright (C) 2019 University of Technology Sydney

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const fs = require("fs");
const assert = require("assert");
const _ = require('lodash');
const expect = require("chai").expect;
const ROCrate = require("../lib/rocrate");
const jsonUtils = require("../lib/utils");
const defaults = require("../lib/defaults");
const uuid = require('uuid').v4;


describe("Resolving linked items with multiple values", function() {


	it("Can resolve links at different depths", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-resolve.json"));
		const crate = new ROCrate(json);
		crate.index();
		//crate.addBackLinks();
		const root = crate.getRootDataset();

//		const pItem = crate.getItem('#person__VICFP_18551934_14_51');


		const pItem = crate.getItem('#person___VICFP_18551934_14_8');

		expect(pItem).to.not.be.empty;


		const sentences = crate.resolve(pItem, [ { property: "conviction"} ]);

		expect(sentences).to.not.be.empty;

		const conv_locations = crate.resolve(pItem, [ { property: "conviction" }, { property: "location"} ]);

		expect(conv_locations).to.not.be.empty;
		
		expect(conv_locations.length).to.equal(sentences.length);

		for( let i = 0; i < sentences.length; i++ ) {
			expect(sentences[i]['location']['@id']).to.equal(conv_locations[i]['@id']);
		}
	}
		
	);


});


