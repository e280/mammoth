
import {time} from "@e280/stz"
import {Wip} from "../types.js"

export function isExpired({created}: Wip) {
	const since = Date.now() - created
	return since > time.days(7)
}

