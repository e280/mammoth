
import {time} from "@e280/stz"
import {consts} from "../consts.js"

export function isExpired(created: number) {
	const since = Date.now() - created
	return since > time.days(consts.expiry_time)
}

