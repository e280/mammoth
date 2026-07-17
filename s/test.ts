
import {bytes, collect} from "@e280/stz"
import {science, test, expect} from "@e280/science"
import {randomId} from "./core/utils/random-id.js"
import {MemoryGlacier} from "./core/memory-glacier.js"

const blob = () => new Blob([new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])])
const quickstream = (b: number[]) => new Blob([new Uint8Array(b)]).stream()

await science.run({
	"glacier": {
		".write and .read": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(blob().stream())
			const second = await glacier.read(hash)
			expect(bytes.eq(await second.bytes(), await blob().bytes()))
		}),

		".write deduplication": test(async() => {
			const glacier = new MemoryGlacier()
			const hashA = await glacier.write(blob().stream())
			const hashB = await glacier.write(blob().stream())
			const keys = await collect(glacier.keys())
			expect(hashA).is(hashB)
			expect(keys.length).is(1)
			expect(keys[0]).is(hashA)
		}),

		".write empty file": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(new Blob().stream())
			expect(await glacier.size(hash)).is(0)
			expect((await glacier.read(hash)).size).is(0)
		}),

		".write distinct files": test(async() => {
			const glacier = new MemoryGlacier()
			const hashA = await glacier.write(quickstream([0xC0, 0xFF, 0xEE]))
			const hashB = await glacier.write(quickstream([0xB0, 0x0B, 0x1E, 0x5]))
			expect(hashA).not.is(hashB)
			expect((await collect(glacier.keys())).length).is(2)
		}),

		".has": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(blob().stream())
			expect(await glacier.has(hash)).is(true)
			expect(await glacier.has(randomId())).is(false)
		}),

		".size": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(blob().stream())
			expect(await glacier.size(hash)).is(4)
		}),

		".delete": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(blob().stream())
			await glacier.delete(hash)
			expect(await glacier.has(hash)).is(false)
			expect(await collect(glacier.keys())).deep([])
		}),

		".delete idempotent": test(async() => {
			const glacier = new MemoryGlacier()
			await glacier.delete(randomId())
		}),

		".keys": test(async() => {
			const glacier = new MemoryGlacier()
			const hash = await glacier.write(blob().stream())
			const keys = await collect(glacier.keys())
			expect(keys.length).is(1)
			expect(keys[0]).is(hash)
		}),
	},
})

