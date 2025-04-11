const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// 数据库文件路径 - 使用绝对路径
const dbPath = path.resolve(process.cwd(), 'data', 'invites.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('无法连接到邀请码数据库:', err);
    } else {
        console.log('已连接到邀请码数据库');
    }
});

// 初始化数据库表
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS invite_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_by TEXT,
        used_at DATETIME,
        is_used BOOLEAN DEFAULT 0
    )`);
});

/**
 * 创建邀请码
 */
function createInviteCode(req, res) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    db.run('INSERT INTO invite_codes (code) VALUES (?)', [code], function(err) {
        if (err) {
            console.error('创建邀请码失败:', err);
            return res.status(500).json({ error: '创建邀请码失败' });
        }
        
        res.json({ 
            success: true, 
            code: code,
            id: this.lastID
        });
    });
}

/**
 * 获取所有邀请码
 */
function getAllInviteCodes(req, res) {
    db.all('SELECT * FROM invite_codes ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('获取邀请码失败:', err);
            return res.status(500).json({ error: '获取邀请码失败' });
        }
        
        res.json(rows);
    });
}

/**
 * 验证邀请码
 */
function verifyInviteCode(code) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM invite_codes WHERE code = ? AND is_used = 0', [code], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

/**
 * 使用邀请码
 */
function useInviteCode(code, userId) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE invite_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?',
            [userId, code],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.changes > 0);
            }
        );
    });
}

module.exports = {
    createInviteCode,
    getAllInviteCodes,
    verifyInviteCode,
    useInviteCode
}; 