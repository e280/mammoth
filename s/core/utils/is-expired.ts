
import {time} from "@e280/stz"
import {consts} from "../consts.js"
import {WriteRecord} from "../types.js"

export function isExpired({created}: WriteRecord) {
	const since = Date.now() - created
	return since > time.days(consts.expiry_time)
}

