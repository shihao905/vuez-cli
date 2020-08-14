### 创建一个基于 vue-cli 的小型脚手架
#### 需求背景
对于日常工作中用的到 vue-cli 创建的项目，因业务需求差异需要针对项目进行额外的配置，为了减少重复性项目搭建时间提高效率，由此开发一个小型的脚手架项目 **vuez-cli**

#### vuez-cli
脚手架主要提供两个方法
```
1： -v、--version      查看当前版本
2： create 项目名称     通过 create 创建项目
```

### 项目目录
```
-- vuez-cli
  -- bin
    -- cli.js       // 命令执行入口文件
  -- build
    -- create.js    // 创建项目文件
  -- templates      // 需要输出的文件目录（这里直接采用 vue-cli 默认创建出来的项目最为项目模板）
    -- 通过vue-cil创建好的项目
  -- package.json   // 项目配置文件

```

### 开发思路
* 通过命令创建项目
* 检查命令执行环境是否存在同名项目
* 创建项目文件
* 拷贝模板至目标文件，根据项目名称修改对应模板里的项目名称
* 完成项目创建
  

#### 创建项目
通过yarn初始化项目依赖包
```
mkdir vuez-cli
cd vuez-cli
yarn init         // 根据个人需求填写对应信息
```
package.json 新增入口文件
```json
// 新增 bin 字段
{
  "name": "vuez-cli",
  "version": "1.0.0",
  "description": "vue 脚手架",
  "main": "index.js",
  "bin": "bin/cli.js",
  "author": "zishu",
  "license": "MIT",
  "dependencies": {
    "commander": "^6.0.0",
    "ejs": "^3.1.3",
    "single-line-log": "^1.1.2"
  }
}
```
创建入口文件 bin/cli.js
```js
#!/usr/bin/env node
//  这里的 #!/usr/bin/env node 是必要的，主要告诉程序通过可以通过 node 脚本来执行此文件
// Linux 和 macOS 需要改写文件权限为755
// chmod 755 cli.js 或 sudo chmod 755 cli.js

// 通过 commander 插件对项目的（版本查看、项目创建）命令进行管理
//帮助快速开发Nodejs命令行工具的package
const program = require('commander')

// 创建项目业务文件
const create = require('../build/create')

// 版本读取
program
  .version(require('../package.json').version, '-v, --version')

// 创建项目执行操作
program
  .command('create <app-name>')
  .description('create a new project by vuez-cli')
  .action((appName) => {
    // 读取到用书输入的项目名称，进行下一步操作
    create(appName)
  })

//解析参数这一行要放到定义的命令最后面
program.parse(process.argv)

```

#### 创建项目文件 
```js
// build/create.js
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')

/**
 * @param {String} appName [项目名称]
*/
module.exports = (appName) => {
  // 用户做的环境路径，也是目标路径
  const targetPath = process.cwd()
  // 获取目标路径下的文件，用来判断是否可以创建项目
  const files = fs.readdirSync(targetPath)
  // 获取模板路径 
  const tplPath = path.resolve(__dirname, '../templates')
  // 如果执行环境存在同名项目，打印提示
  if (files.includes(appName)) {
    console.log('已存在该项目！')
  } else {
    // 目标路径
    let tPath = `${targetPath}/${appName}`
    // 创建项目
    fs.mkdirSync(tPath)

    // writeFile 写入模板项目到目标项目 
    // getWriteFileList 获取要输出的文件信息列表
    writeFile(
      getWriteFileList(tPath, tplPath, appName), 
      appName
    )
  }
}

/**
 * 获取要输出的文件信息对象，并创建对应目录
 * 通过递归获取模板项目下的所有文件并返回列表信息
 * @param {String} toPath [某个目标文件路径]
 * @param {String} tplPath [某个对应的模板文件路径]
*/
function getWriteFileList (toPath, tplPath) {
  // 读取某一个模板路径下的文件
  let files = fs.readdirSync(tplPath)
  let fileList = []
  if (files && files.length) {
    files.forEach(file => {
      // 如果是 .DS_Store 文件忽略
      if (file != '.DS_Store') {
        const toChildFile = `${toPath}/${file}`
        const tplChildFile = `${tplPath}/${file}`
        // 判断是否是文件夹
        if (fs.statSync(tplChildFile).isDirectory()) {
          // 如果是文件夹，在目标目录创建文件夹
          fs.mkdirSync(toChildFile)
          // 合并子文件夹内的文件信息
          fileList = fileList.concat(getWriteFileList(toChildFile, tplChildFile))
        } else {
          // 新增文件信息
          fileList.push({
            name: file,
            toPath: toChildFile,    // 准备输出的路径
            tplPath: tplChildFile   // 文件模板来源路径
          })
        }
      }
    })
  }
  return fileList
}

/**
 * @param {Array} fileList [需要输出的文件路径]
 * @param {String} appName [项目名称] 用来添加模板信息
*/
function writeFile(fileList, appName) {
  // 缓存文件数，来判断是否还有待传输文件
  let length = fileList.length

  // 创建 log 函数用来判断是否传输完成
  const log = (num) => !num && console.log('创建完成！')

  fileList.forEach(file => {
    // 判断文件是否需要做模板编译，这里并不是所有文件都需要做模板数据填充
    if (needCheck(file.name)) {
      // 如果需要模板编译则通过 ejs 进行编译然后输出
      ejs.renderFile(file.tplPath, {name: appName}, (err, result) => {
        if (err) throw err
        fs.writeFileSync(file.toPath, result)
        log(--length)
      })
    } else {
      // 如果不需要直接输出文件
      fs.readFile(file.tplPath, (err, data) => {
        if (err) throw err
        fs.writeFileSync(file.toPath, data)
        log(--length)
      })
    }
  })
}

/**
 * 判断是否需要进行模板编译
 * @param {Object} file [文件信息]
*/
function needCheck(file) {
  const type = file.split('.').slice(1).pop()
  if (type && /^html|js|css|json|ts|md|vue$/g.test(type.toLocaleLowerCase())) {
    return true
  }
  return false
}

```