
![](https://i.imgur.com/1TQmFwW.png)

# 🦣 mammoth
> *big files. small api.*

**mammoth is a file storage typescript library.** we use it in our web apps for storing files like user uploads. it's content-addressed. files are streamed into a bucket, identified by their blake3 hash, and deduplicated. mammoth works the same whether it's backed by a bucket in memory, on disk, in the cloud, or in the browser's opfs.

```bash
npm install @e280/mammoth
```

```ts
import {Mammoth} from "@e280/mammoth"

const mammoth = new Mammoth()
```

### 🦣 mammoth stores files.
- **write a file,** and you get back its blake3 hash.
    ```ts
    const hash = await mammoth.write(blob.stream())
    ```
- **read a file,** identified by its hash.
    ```ts
    const blob = await mammoth.read(hash)
    ```
- **delete a file.**
    ```ts
    await mammoth.delete(hash)
    ```

### 🦣 mammoth is bucket-agnostic.
- **memory bucket,** for testing.
  ```ts
  import {Mammoth, MemoryBucket} from "@e280/mammoth"
  import {Kv} from "@e280/kv"

  const mammoth = new Mammoth(
    new MemoryBucket(),
    new Kv(),
  )
  ```
  defaults shown, so, this is equivalent:
  ```ts
  const mammoth = new Mammoth()
  ```
- **disk bucket,** for nodejs servers. *(note the import paths)*
  ```ts
  import {Mammoth} from "@e280/mammoth"
  import {DiskBucket} from "@e280/mammoth/node"
  import {Kv} from "@e280/kv"
  import {LevelDriver} from "@e280/kv/level"

  const mammoth = new Mammoth(
    new DiskBucket("./data/bucket"),
    new Kv(new LevelDriver("./data/kv")),
  )
  ```
- **opfs bucket,** for local storage in the browser. *(note the import paths)*
  ```ts
  import {Mammoth} from "@e280/mammoth"
  import {OpfsBucket} from "@e280/mammoth/browser"
  import {Kv, StorageDriver} from "@e280/kv"

  const mammoth = new Mammoth(
    new OpfsBucket(await navigator.storage.getDirectory()),
    new Kv(new StorageDriver(localStorage)),
  )
  ```

### 🦣 more mammoth methods.
- **check if a file exists,** get back a boolean.
    ```ts
    const exists = await mammoth.has(hash)
    ```
- **get file info,** including size in bytes, added timestamp, and bucket id.
    ```ts
    const {size, added, id} = await mammoth.info(hash)
    ```
- **get stats,** for the whole datalake.
    ```ts
    await mammoth.stats()
      // {count: 123, size: 123456789}
    ```
- **loop over all hashes,** for all stored files.
    ```ts
    for await (const hash of mammoth.hashes())
      console.log(hash)
    ```



<br/><br/>

*https://e280.org/*

