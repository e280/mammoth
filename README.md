
![](https://i.imgur.com/qqiMrZ5.png)

# 🦣 @e280/mammoth
## big files. small api.

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
    new Kv(),
    new MemoryBucket(),
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
    new Kv(new LevelDriver("./data/kv")),
    new DiskBucket("./data/bucket"),
  )
  ```
- **opfs bucket,** for local storage in the browser. *(note the import paths)*
  ```ts
  import {Mammoth} from "@e280/mammoth"
  import {OpfsBucket} from "@e280/mammoth/browser"
  import {Kv, StorageDriver} from "@e280/kv"

  const mammoth = new Mammoth(
    new Kv(new StorageDriver(localStorage)),
    new OpfsBucket(await navigator.storage.getDirectory()),
  )
  ```

### 🦣 mammoth has a few more methods for you.
- **check if a file exists,** get back a boolean.
    ```ts
    const exists = await mammoth.has(hash)
    ```
- **get file size,** in bytes.
    ```ts
    const size = await mammoth.size(hash)
    ```
- **get stats,** for the whole datalake.
    ```ts
    await mammoth.stats()
      // {size: 1234567}
    ```
- **loop over all hashes,** for all stored files.
    ```ts
    for await (const hash of mammoth.hashes())
      console.log(hash)
    ```



<br/><br/>

> *by [e280](https://e280.org/)*

