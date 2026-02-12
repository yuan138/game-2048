const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const app = express();

// -------------------------- 部署稳定性配置 --------------------------
// 1. 端口配置（云服务器建议使用1024以上端口，避免权限问题）
const PORT = process.env.PORT || 3000;
// 2. 日志大小限制（避免无限增长导致磁盘满）
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
// 3. 跨域配置（云服务器部署必加）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// -------------------------- 基础配置 --------------------------
app.use(express.static(__dirname));
app.use(bodyParser.json({ limit: '1mb' })); // 限制请求体大小，防攻击
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// -------------------------- 文件路径配置 --------------------------
const USER_DATA_FILE = path.join(__dirname, 'userData.json');
const ACCESS_LOG_FILE = path.join(__dirname, 'accessLog.json');
// 备份文件路径（防止文件损坏）
const USER_DATA_BACKUP = path.join(__dirname, 'userData.backup.json');
const ACCESS_LOG_BACKUP = path.join(__dirname, 'accessLog.backup.json');

// -------------------------- 工具函数（增加容错） --------------------------
/**
 * 加密函数（稳定版）
 * @param {string} pwd - 明文密码
 * @returns {string} 加密后字符串
 */
const encryptPwd = (pwd) => {
  if (!pwd || typeof pwd !== 'string') return '';
  return crypto.createHash('sha256').update(pwd.trim()).digest('hex');
};

/**
 * 安全读取JSON文件（容错+重建）
 * @param {string} filePath - 文件路径
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析后的数据
 */
const safeReadJson = (filePath, defaultValue) => {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    // 检查文件大小，防止空文件
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      fs.renameSync(filePath, `${filePath}.corrupted`); // 备份损坏文件
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件${filePath}失败：`, error.message);
    // 尝试从备份恢复
    if (fs.existsSync(`${filePath}.backup`)) {
      try {
        fs.copyFileSync(`${filePath}.backup`, filePath);
        return safeReadJson(filePath, defaultValue);
      } catch (e) {
        console.error('备份恢复失败：', e.message);
      }
    }
    return defaultValue;
  }
};

/**
 * 安全写入JSON文件（备份+重试）
 * @param {string} filePath - 文件路径
 * @param {any} data - 要写入的数据
 * @returns {boolean} 是否成功
 */
const safeWriteJson = (filePath, data) => {
  try {
    // 先备份原文件
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, `${filePath}.backup`);
    }
    // 格式化写入，避免JSON错误
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    return true;
  } catch (error) {
    console.error(`写入文件${filePath}失败：`, error.message);
    // 重试一次
    try {
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
      return true;
    } catch (e) {
      console.error('重试写入仍失败：', e.message);
      return false;
    }
  }
};

/**
 * 清理过大的日志文件
 * @param {string} filePath - 日志文件路径
 */
const cleanLargeLog = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_LOG_SIZE) {
        // 保留最新100条日志
        const logs = safeReadJson(filePath, []);
        const newLogs = logs.slice(-100); // 只保留最后100条
        safeWriteJson(filePath, newLogs);
        console.log(`清理日志文件${filePath}，保留最新100条`);
      }
    }
  } catch (error) {
    console.error('清理日志失败：', error.message);
  }
};

// -------------------------- 初始化函数（增加容错） --------------------------
function initUserData() {
  const existingUsers = safeReadJson(USER_DATA_FILE, {});
  // 仅在无用户时初始化（避免覆盖已有数据）
  if (Object.keys(existingUsers).length === 0) {
    const initialUsers = {
      administrator: {
        password: encryptPwd('YDS2893064167'),
        twoFactorCode: encryptPwd('213221'),
        role: 'admin',
        permissions: ['view_access_data', 'basic_modify', 'view_logs'],
        createTime: new Date().toISOString()
      },
      user: {
        password: encryptPwd('202602'),
        twoFactorCode: '',
        role: 'user',
        permissions: ['play_game'],
        createTime: new Date().toISOString()
      }
    };
    safeWriteJson(USER_DATA_FILE, initialUsers);
    console.log('用户数据初始化完成');
  }
}

function initAccessLog() {
  const existingLogs = safeReadJson(ACCESS_LOG_FILE, []);
  if (!Array.isArray(existingLogs)) {
    safeWriteJson(ACCESS_LOG_FILE, []);
    console.log('访问日志初始化完成');
  }
  // 启动时清理过大日志
  cleanLargeLog(ACCESS_LOG_FILE);
}

// -------------------------- 业务逻辑函数 --------------------------
function getUserData() {
  return safeReadJson(USER_DATA_FILE, {});
}

function getAccessLog() {
  return safeReadJson(ACCESS_LOG_FILE, []);
}

function recordAccessLog(username, action, ip) {
  try {
    const logs = getAccessLog();
    logs.push({
      username: username || 'unknown',
      action: action || 'unknown',
      ip: ip || 'unknown',
      time: new Date().toISOString()
    });
    // 写入前清理过大日志
    cleanLargeLog(ACCESS_LOG_FILE);
    safeWriteJson(ACCESS_LOG_FILE, logs);
  } catch (error) {
    console.error('记录日志失败：', error.message);
  }
}

// -------------------------- 接口（增加参数校验） --------------------------
app.post('/api/login', (req, res) => {
  try {
    // 严格参数校验，防止非法参数导致崩溃
    const { username, password, twoFactorCode } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    const users = getUserData();
    const user = users[username?.trim()];

    if (!user) {
      recordAccessLog(username, 'login_failed: user not exist', req.ip);
      return res.status(401).json({ success: false, message: '用户名不存在' });
    }

    if (user.password !== encryptPwd(password)) {
      recordAccessLog(username, 'login_failed: wrong password', req.ip);
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    if (user.role === 'admin' && user.twoFactorCode !== encryptPwd(twoFactorCode)) {
      recordAccessLog(username, 'login_failed: wrong two-factor code', req.ip);
      return res.status(401).json({ success: false, message: '二次验证码错误' });
    }

    recordAccessLog(username, 'login_success', req.ip);
    res.json({
      success: true,
      message: '登录成功',
      userInfo: {
        username: username.trim(),
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('登录接口异常：', error.stack);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.get('/api/admin/access-data', (req, res) => {
  try {
    const { username } = req.query || {};
    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    const users = getUserData();
    const user = users[username.trim()];

    if (!user || user.role !== 'admin' || !user.permissions.includes('view_access_data')) {
      return res.status(403).json({ success: false, message: '无访问权限' });
    }

    const accessLog = getAccessLog();
    const accessData = {};
    accessLog.forEach(log => {
      if (!accessData[log.username]) {
        accessData[log.username] = {
          loginSuccess: 0,
          loginFailed: 0,
          total: 0,
          lastAccess: ''
        };
      }
      accessData[log.username].total++;
      accessData[log.username].lastAccess = log.time;
      if (log.action === 'login_success') {
        accessData[log.username].loginSuccess++;
      } else if (log.action.startsWith('login_failed')) {
        accessData[log.username].loginFailed++;
      }
    });

    res.json({ success: true, data: accessData });
  } catch (error) {
    console.error('查看访问数据接口异常：', error.stack);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.get('/api/admin/logs', (req, res) => {
  try {
    const { username } = req.query || {};
    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    const users = getUserData();
    const user = users[username.trim()];

    if (!user || user.role !== 'admin' || !user.permissions.includes('view_logs')) {
      return res.status(403).json({ success: false, message: '无访问权限' });
    }

    const logs = getAccessLog();
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('查看日志接口异常：', error.stack);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// -------------------------- 全局异常捕获（防止进程崩溃） --------------------------
// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常：', error.stack);
  // 记录崩溃日志
  safeWriteJson(path.join(__dirname, 'crash.log'), {
    time: new Date().toISOString(),
    error: error.message,
    stack: error.stack
  });
  // 云服务器建议重启进程，这里先打印日志不退出
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝：', reason, promise);
});

// 进程退出钩子
process.on('exit', (code) => {
  console.log(`进程即将退出，退出码：${code}`);
});

// -------------------------- 启动服务（增加端口监听容错） --------------------------
initUserData();
initAccessLog();

const server = app.listen(PORT, () => {
  console.log(`2048游戏服务启动成功，端口：${PORT}`);
  console.log(`访问地址：http://服务器IP:${PORT}/login.html`);
});

// 监听端口错误
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口${PORT}已被占用，尝试端口${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`服务启动成功，端口：${PORT + 1}`);
    });
  } else if (error.code === 'EACCES') {
    console.error(`无权限使用端口${PORT}，请使用1024以上端口`);
  } else {
    console.error('服务启动失败：', error.message);
  }
});