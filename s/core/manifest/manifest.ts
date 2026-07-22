
import {Kv} from "@e280/kv"
import {Write} from "./types.js"
import {Info, Stats} from "../types.js"

export class Manifest {

	/** statistics about the whole datalake */
	stats

	/** associates file hashes with bucket ids */
	catalog

	/** temporary record of writes in-progress */
	writes

	/** bucket ids that are pending deletion */
	trash

	constructor(public kv: Kv) {
		this.stats = kv.cell<Stats>("stats")
		this.catalog = kv.scope<Info>("catalog")
		this.writes = kv.scope<Write>("writes")
		this.trash = kv.scope<true>("trash")
	}
}

