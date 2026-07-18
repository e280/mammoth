
import {time} from "@e280/stz"
import {Wip} from "../types.js"
import {consts} from "../consts.js"

export function isExpired({created}: Wip) {
	const since = Date.now() - created
	return since > time.days(consts.expiry_time)
}

