
import {science, test, expect} from "@e280/science"

await science.run({
	"addition works": test(async() => {
		expect(2 + 2).is(4)
	}),
})

