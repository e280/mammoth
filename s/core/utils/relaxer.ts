
/** a clock that signals when a long-running operation should yield */
export function relaxer(delta = 1000 / 60) {
	let last = performance.now()

	return () => {
		const now = performance.now()
		const since = now - last

		if (since > delta) {
			last = now
			return true
		}

		return false
	}
}

