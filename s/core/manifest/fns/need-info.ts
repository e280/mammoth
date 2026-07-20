
import {got} from "@e280/stz"
import {Hash} from "../../types.js"
import {Manifest} from "../manifest.js"
import {notFoundMessage} from "../../utils/not-found.js"

export async function needInfo({catalog}: Manifest, hash: Hash) {
	return got(await catalog.get(hash), notFoundMessage(hash))
}

