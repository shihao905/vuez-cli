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
