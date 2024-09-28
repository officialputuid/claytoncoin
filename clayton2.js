const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const { DateTime } = require('luxon');
const { HttpsProxyAgent } = require('https-proxy-agent');

const maxThreads = 10; // số luồng

class Clayton {
    constructor(accountIndex, proxy, initData) {
        this.accountIndex = accountIndex;
        this.proxy = proxy;
        this.initData = initData;
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Content-Type": "application/json",
            "Origin": "https://tonclayton.fun",
            "Referer": "https://tonclayton.fun/?tgWebAppStartParam=376905749",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        };
        this.proxyIP = null;
    }

    async log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const accountPrefix = `[Tài khoản ${this.accountIndex + 1}]`;
        const ipPrefix = this.proxyIP ? `[${this.proxyIP}]` : '[Unknown IP]';
        let logMessage = '';

        switch(type) {
            case 'success':
                logMessage = `${accountPrefix}${ipPrefix} ${msg}`.green;
                break;
            case 'error':
                logMessage = `${accountPrefix}${ipPrefix} ${msg}`.red;
                break;
            case 'warning':
                logMessage = `${accountPrefix}${ipPrefix} ${msg}`.yellow;
                break;
            default:
                logMessage = `${accountPrefix}${ipPrefix} ${msg}`.blue;
        }

        console.log(logMessage);
    }

    async checkProxyIP() {
        try {
            const proxyAgent = new HttpsProxyAgent(this.proxy);
            const response = await axios.get('https://api.ipify.org?format=json', { httpsAgent: proxyAgent });
            if (response.status === 200) {
                this.proxyIP = response.data.ip;
                return response.data.ip;
            } else {
                throw new Error(`Cannot check proxy IP. Status code: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error checking proxy IP: ${error.message}`);
        }
    }

    async makeRequest(url, method, data = {}) {
        const headers = { ...this.headers, "Init-Data": this.initData };
        const proxyAgent = new HttpsProxyAgent(this.proxy);

        try {
            const response = await axios({
                method,
                url,
                data,
                headers,
                httpsAgent: proxyAgent
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login() {
        return this.makeRequest("https://tonclayton.fun/api/user/login", 'post');
    }

    async dailyClaim() {
        return this.makeRequest("https://tonclayton.fun/api/user/daily-claim", 'post');
    }

    async startFarm() {
        return this.makeRequest("https://tonclayton.fun/api/user/start", 'post');
    }

    async claimFarm() {
        return this.makeRequest("https://tonclayton.fun/api/user/claim", 'post');
    }

    async getPartnerTasks() {
        return this.makeRequest("https://tonclayton.fun/api/user/partner/get", 'post');
    }

    async completePartnerTask(taskId) {
        return this.makeRequest(`https://tonclayton.fun/api/user/partner/complete/${taskId}`, 'post');
    }

    async rewardPartnerTask(taskId) {
        return this.makeRequest(`https://tonclayton.fun/api/user/partner/reward/${taskId}`, 'post');
    }

    async handlePartnerTasks() {
        const tasksResult = await this.getPartnerTasks();
        if (tasksResult.success) {
            const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed);
            for (const task of uncompletedTasks) {
                const completeResult = await this.completePartnerTask(task.task_id);
                if (completeResult.success) {
                    const rewardResult = await this.rewardPartnerTask(task.task_id);
                    if (rewardResult.success) {
                        this.log(`Làm nhiệm vụ ${task.task_name} thành công`, 'success');
                    } else {
                        this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task_name}: ${rewardResult.error || 'Lỗi không xác định'}`, 'error');
                    }
                } else {
                    this.log(`Không thể hoàn thành nhiệm vụ ${task.task_name}: ${completeResult.error || 'Lỗi không xác định'}`, 'error');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            this.log(`Không thể lấy danh sách nhiệm vụ đối tác: ${tasksResult.error || 'Lỗi không xác định'}`, 'error');
        }
    }

    async handleTwitterTask() {
        const checkResult = await this.makeRequest("https://tonclayton.fun/api/user/task-twitter", 'post');
        
        if (checkResult.success && checkResult.data.claimed === false) {
            const claimResult = await this.makeRequest("https://tonclayton.fun/api/user/task-twitter-claim", 'post');
            
            if (claimResult.success && claimResult.data.message === "Task status updated") {
                this.log("Làm nhiệm vụ Twitter thành công", 'success');
            } else {
                this.log("Không thể hoàn thành nhiệm vụ Twitter", 'error');
            }
        }
    }

    async handleBotTask() {
        const checkResult = await this.makeRequest("https://tonclayton.fun/api/user/task-bot", 'post');
        
        if (checkResult.success && checkResult.data.bot === true && checkResult.data.claim === false) {
            const claimResult = await this.makeRequest("https://tonclayton.fun/api/user/task-bot-claim", 'post');
            
            if (claimResult.success && claimResult.data.claimed) {
                this.log(`Làm nhiệm vụ use bot thành công. Nhận được ${claimResult.data.claimed} CL`, 'success');
            } else {
                this.log("Không thể hoàn thành nhiệm vụ use bot", 'error');
            }
        }
    }

    async handleDailyTasks() {
        const dailyTasksResult = await this.makeRequest("https://tonclayton.fun/api/user/daily-tasks", 'post');
        
        if (dailyTasksResult.success) {
            const uncompletedTasks = dailyTasksResult.data.filter(task => !task.is_completed);
            
            for (const task of uncompletedTasks) {
                const completeResult = await this.makeRequest(`https://tonclayton.fun/api/user/daily-task/${task.id}/complete`, 'post');
                
                if (completeResult.success) {
                    const claimResult = await this.makeRequest(`https://tonclayton.fun/api/user/daily-task/${task.id}/claim`, 'post');
                    
                    if (claimResult.success && claimResult.data.message === "Reward claimed successfully") {
                        this.log(`Làm nhiệm vụ ${task.task_type} thành công | nhận ${claimResult.data.reward} CL`, 'success');
                    } else {
                        this.log(`Không thể nhận thưởng nhiệm vụ ${task.task_type}`, 'error');
                    }
                } else {
                    this.log(`Nhiệm vụ lỗi ${task.task_type}: ${completeResult.error || 'Lỗi không xác định'}`, 'error');
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async playGame() {
        while (true) {
            const loginResult = await this.login();
            if (!loginResult.success) {
                this.log("Không kiểm tra được vé", 'error');
                return;
            }
    
            const tickets = loginResult.data.user.tickets;
            if (tickets <= 0) {
                this.log("Không còn vé nữa. dừng chơi game.", 'info');
                return;
            }

            let gameStarted = false;
            let startAttempts = 0;
            const maxStartAttempts = 1;

            while (!gameStarted && startAttempts < maxStartAttempts) {
                startAttempts++;
                const startGameResult = await this.makeRequest("https://tonclayton.fun/api/game/start-game", 'post');
                if (startGameResult.success && startGameResult.data.message === "Game started successfully") {
                    this.log("Trò chơi đã bắt đầu thành công", 'success');
                    gameStarted = true;
                } else {
                    this.log(`Không thể bắt đầu trò chơi (Lần thử ${startAttempts}/${maxStartAttempts})`, 'error');
                    if (startAttempts < maxStartAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }

            if (!gameStarted) {
                this.log("Không thể bắt đầu trò chơi sau 3 lần thử. Dừng chơi game.", 'error');
                return;
            }
    
            const fixedMilestones = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
            const allMilestones = [...fixedMilestones].sort((a, b) => a - b);
            const gameEndTime = Date.now() + 150000;
    
            for (const milestone of allMilestones) {
                if (Date.now() >= gameEndTime) break;
                
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
    
                const saveGameResult = await this.makeRequest("https://tonclayton.fun/api/game/save-tile-game", 'post', { maxTile: milestone });
                if (saveGameResult.success && saveGameResult.data.message === "MaxTile saved successfully") {
                    this.log(`Đã đạt đến ô ${milestone}`, 'success');
                }
            }
    
            const endGameResult = await this.makeRequest("https://tonclayton.fun/api/game/over-game", 'post');
            if (endGameResult.success) {
                const reward = endGameResult.data;
                this.log(`Trò chơi đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'custom');
            } else {
                this.log(`Lỗi kết thúc trò chơi: ${endGameResult.error || 'Lỗi không xác định'}`, 'error');
            }
    
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    async processAccount() {
        try {
            await this.checkProxyIP();
        } catch (error) {
            this.log(`Cannot check proxy IP: ${error.message}`, 'warning');
        }

        let loginSuccess = false;
        let loginAttempts = 0;
        let loginResult;

        while (!loginSuccess && loginAttempts < 3) {
            loginAttempts++;
            this.log(`Đăng nhập... (Lần thử ${loginAttempts})`, 'info');
            loginResult = await this.login();
            if (loginResult.success) {
                loginSuccess = true;
            } else {
                this.log(`Đăng nhập thất bại: ${loginResult.error}`, 'error');
                if (loginAttempts < 3) {
                    this.log('Thử lại...', 'info');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (!loginSuccess) {
            this.log('Đăng nhập không thành công sau 3 lần thử. Bỏ qua tài khoản.', 'error');
            return;
        }

        const userInfo = loginResult.data.user;
        this.log(`CL: ${userInfo.tokens} CL | ${userInfo.daily_attempts} Ticket`, 'info');

        if (loginResult.data.dailyReward.can_claim_today) {
            this.log('Yêu cầu phần thưởng hàng ngày...', 'info');
            const claimResult = await this.dailyClaim();
            if (claimResult.success && claimResult.data.message === "daily reward claimed successfully") {
                this.log('Phần thưởng hàng ngày đã được nhận thành công!', 'success');
            } else {
                this.log(`Không thể nhận phần thưởng hàng ngày: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }
        }

        if (!userInfo.active_farm) {
            this.log('Bắt đầu farm...', 'info');
            const startResult = await this.startFarm();
            if (startResult.success) {
                const finishTime = DateTime.fromISO(startResult.data.start_time).plus({ hours: 6 });
                this.log(`Farm đang hoạt động. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'success');
            } else {
                this.log(`Không thể bắt đầu farm: ${startResult.error || 'Lỗi không xác định'}`, 'error');
            }
        } else {
            if (!userInfo.can_claim) {
                const finishTime = DateTime.fromISO(userInfo.start_time).plus({ hours: 6 });
                this.log(`Farm đang hoạt động. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'info');
            } else {
                this.log('Đang nhận phần thưởng farm...', 'info');
                const claimResult = await this.claimFarm();
                if (claimResult.success) {
                    this.log(`Claim thành công. Nhận ${claimResult.data.claim} CL và ${claimResult.data.xp_earned} XP | Balance: ${claimResult.data.tokens}`, 'success');
                    
                    this.log('Đang bắt đầu farm mới...', 'info');
                    const startResult = await this.startFarm();
                    if (startResult.success) {
                        const finishTime = DateTime.fromISO(startResult.data.start_time).plus({ hours: 6 });
                        this.log(`Farm mới bắt đầu. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'success');
                    } else {
                        this.log(`Không thể bắt đầu farm mới: ${startResult.error || 'Lỗi không xác định'}`, 'error');
                    }
                } else {
                    this.log(`Không thể nhận phần thưởng farm: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.handlePartnerTasks();
        await this.handleTwitterTask();
        await this.handleBotTask();
        await this.handleDailyTasks();
        if (userInfo.daily_attempts > 0) {
            await this.playGame();
        } else {
            this.log(`Không còn vé trò chơi`, 'success');
        }
    }
}

async function main() {
    const dataFile = path.join(__dirname, 'data.txt');
    const data = fs.readFileSync(dataFile, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean);

    const proxyFile = path.join(__dirname, 'proxy.txt');
    const proxies = fs.readFileSync(proxyFile, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean);

    while (true) {
        for (let i = 0; i < data.length; i += maxThreads) {
            const batch = data.slice(i, i + maxThreads);

            const promises = batch.map((initData, indexInBatch) => {
                const accountIndex = i + indexInBatch;
                const proxy = proxies[accountIndex % proxies.length];
                const client = new Clayton(accountIndex, proxy, initData);
                return timeout(client.processAccount(), 10 * 60 * 1000).catch(err => {
                    client.log(`Lỗi xử lý tài khoản: ${err.message}`, 'error');
                });
            });

            await Promise.allSettled(promises);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        console.log(`Hoàn thành tất cả tài khoản, chờ 6 giờ để tiếp tục`);
        await new Promise(resolve => setTimeout(resolve, 21900 * 1000));
    }
}

function timeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timeout'));
        }, ms);

        promise.then(value => {
            clearTimeout(timer);
            resolve(value);
        }).catch(err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
