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

const PERSONID = '#person___VICFP_18551934_14_8';
const NCONVICTIONS = 58;
const COURTS = [
	"#place_MELBOURNE PETTY SESSIONS",
	"#place_CARLTON PETTY SESSIONS",
	"#place_NORTH MELBOURNE PETTY SESSIONS",
	"#place_COBURG PRISON POLICE MAGISTRATE",
	"#place_UNKNOWN",
	"#place_FITZROY PETTY SESSIONS",
	"#place_CALRTON PETTY SESSIONS",
	"#place_SOUTH MELBOURNE PETTY SESSIONS",
	"#place_RICHMOND PETTY SESSIONS"
];

const COUNT_FORS = 3;
const COUNT_SEOS = 2;
const COUNT_INCLUDERS = 2;

describe("Resolving linked items with multiple values", function() {

	it("can resolve multiple links two hops from an item", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-resolve.json"));
		const crate = new ROCrate(json);
		crate.index();
		crate.addBackLinks();
		const root = crate.getRootDataset();

		const pItem = crate.getItem(PERSONID);
		expect(pItem).to.not.be.empty;

		const sentences = crate.resolve(pItem, [ { property: "conviction"} ]);

		expect(sentences).to.not.be.empty;
		expect(sentences.length).to.equal(NCONVICTIONS);

		const conv_locations = crate.resolve(pItem, [ { property: "conviction" }, { property: "location"} ]);

		expect(conv_locations).to.not.be.empty;	
		expect(conv_locations.length).to.equal(COURTS.length);

		// all of the location ids from the convictions are in the location list

		const loc_ids = conv_locations.map((l) => l['@id']);
		for( let s of sentences ) {
			expect(loc_ids).to.include(s['location']['@id']);
		}
	});


	it("can resolve multiple reverse links", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-resolve.json"));
		const crate = new ROCrate(json);
		crate.index();
		crate.addBackLinks();
		const root = crate.getRootDataset();

		const pItem = crate.getItem(PERSONID);
		expect(pItem).to.not.be.empty;

		const convictions = crate.resolve(pItem, [ { property: "conviction" }]);
		const convictions_r = crate.resolve(pItem, [ { property: "object", "@reverse": true }]);

		expect(convictions_r).to.not.be.empty;
		expect(convictions_r.length).to.equal(NCONVICTIONS);
		expect(convictions_r.length).to.equal(convictions.length);

		const locations_r = crate.resolve(pItem, [
			{ property: "object", "@reverse": true },
			{ property: "location"}
		]);

		expect(locations_r).to.not.be.empty;	
		expect(locations_r.length).to.equal(COURTS.length);

		// all of the location ids from the convictions are in the reverse 
		// location list

		const loc_ids = locations_r.map((l) => l['@id']);
		for( let c of convictions ) {
			expect(loc_ids).to.include(c['location']['@id']);
		}

	});


});


describe("Conditional resolution with include", function() {

	it("can resolve items of a particular type, via include", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-conditional.jsonld"));
		const crate = new ROCrate(json);
		crate.index();

		const root = crate.getRootDataset();

		const includers = crate.resolve(root, [ {
			property: "hasPart",
			includes: { "@type": "ImageObject" }
		}]);

		expect(includers).to.not.be.empty;
		expect(includers.length).to.equal(COUNT_INCLUDERS);

		for( let i of includers ) {
			expect(i['@type']).to.equal('ImageObject');
		}

	});

});




describe("Conditional resolution with matchFn", function() {

	it("can resolve items which match a regexp", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-conditional.jsonld"));
		const crate = new ROCrate(json);
		crate.index();

		const root = crate.getRootDataset();

		const for_codes = crate.resolve(root, [ {
			property: "about",
			matchFn: (item) => item['@id'].match(/anzsrc-for/)
		}]);

		const seo_codes = crate.resolve(root, [ {
			property: "about",
			matchFn: (item) => item['@id'].match(/anzsrc-seo/)
		}]);

		expect(for_codes).to.not.be.empty;
		expect(for_codes.length).to.equal(COUNT_FORS);

		expect(seo_codes).to.not.be.empty;
		expect(seo_codes.length).to.equal(COUNT_SEOS);


	});

});



describe("Collect items when resolving links", function() {

	it("can resolve multiple links two hops from an item", async function () {
		json = JSON.parse(fs.readFileSync("test_data/ro-crate-metadata-resolve.json"));
		const crate = new ROCrate(json);
		crate.index();
		crate.addBackLinks();
		const root = crate.getRootDataset();

		const pItem = crate.getItem(PERSONID);
		expect(pItem).to.not.be.empty;

		const subgraph = crate.prune(pItem, [ { property: "conviction" }, { property: "location"} ]);

		console.log(JSON.stringify(subgraph, null, 2));

		expect(subgraph).to.not.be.empty;
	});

