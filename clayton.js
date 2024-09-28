const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { DateTime } = require('luxon');

class Clayton {
    constructor() {
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
        this.firstAccountFarmEndTime = null;
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [!] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Chờ ${i} giây để tiếp tục vòng lặp =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.log('', 'info');
    }

    async login(initData) {
        const url = "https://tonclayton.fun/api/user/login";
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async dailyClaim(initData) {
        const url = "https://tonclayton.fun/api/user/daily-claim";
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async startFarm(initData) {
        const url = "https://tonclayton.fun/api/user/start";
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async claimFarm(initData) {
        const url = "https://tonclayton.fun/api/user/claim";
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getPartnerTasks(initData) {
        const url = "https://tonclayton.fun/api/user/partner/get";
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async completePartnerTask(initData, taskId) {
        const url = `https://tonclayton.fun/api/user/partner/complete/${taskId}`;
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async rewardPartnerTask(initData, taskId) {
        const url = `https://tonclayton.fun/api/user/partner/reward/${taskId}`;
        const headers = { ...this.headers, "Init-Data": initData };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200) {
                return { success: true, data: response.data };
            } else {
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async handlePartnerTasks(initData) {
        this.log('Đang kiểm tra nhiệm vụ...', 'info');
        const tasksResult = await this.getPartnerTasks(initData);
        if (tasksResult.success) {
            const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed);
            for (const task of uncompletedTasks) {
                this.log(`Đang thực hiện nhiệm vụ ${task.task_name}...`, 'info');
                const completeResult = await this.completePartnerTask(initData, task.task_id);
                if (completeResult.success) {
                    const rewardResult = await this.rewardPartnerTask(initData, task.task_id);
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

    async handleTwitterTask(initData) {
        const checkUrl = "https://tonclayton.fun/api/user/task-twitter";
        const claimUrl = "https://tonclayton.fun/api/user/task-twitter-claim";
        const headers = { ...this.headers, "Init-Data": initData };

        try {
            const checkResponse = await axios.post(checkUrl, {}, { headers });
            
            if (checkResponse.data.claimed === false) {
                const claimResponse = await axios.post(claimUrl, {}, { headers });
                
                if (claimResponse.data.message === "Task status updated") {
                    this.log("Làm nhiệm vụ Twitter thành công", 'success');
                } else {
                    this.log("Không thể hoàn thành nhiệm vụ Twitter", 'error');
                }
            }
        } catch (error) {
            this.log(`Lỗi khi xử lý nhiệm vụ Twitter: ${error.message}`, 'error');
        }
    }

    
    async handleBotTask(initData) {
        const checkUrl = "https://tonclayton.fun/api/user/task-bot";
        const claimUrl = "https://tonclayton.fun/api/user/task-bot-claim";
        const headers = { ...this.headers, "Init-Data": initData };

        try {
            const checkResponse = await axios.post(checkUrl, {}, { headers });
            
            if (checkResponse.data.bot === true && checkResponse.data.claim === false) {
                const claimResponse = await axios.post(claimUrl, {}, { headers });
                
                if (claimResponse.data.claimed) {
                    this.log(`Làm nhiệm vụ use bot thành công. Nhận được ${claimResponse.data.claimed} CL`, 'success');
                } else {
                    this.log("Không thể hoàn thành nhiệm vụ use bot", 'error');
                }
            }
        } catch (error) {
            this.log(`Lỗi khi xử lý nhiệm vụ use bot: ${error.message}`, 'error');
        }
    }

    async handleDailyTasks(initData) {
        const dailyTasksUrl = "https://tonclayton.fun/api/user/daily-tasks";
        const headers = { ...this.headers, "Init-Data": initData };

        try {
            const response = await axios.post(dailyTasksUrl, {}, { headers });
            
            if (response.status === 200) {
                const uncompletedTasks = response.data.filter(task => !task.is_completed);
                
                for (const task of uncompletedTasks) {
                    const completeUrl = `https://tonclayton.fun/api/user/daily-task/${task.id}/complete`;
                    const claimUrl = `https://tonclayton.fun/api/user/daily-task/${task.id}/claim`;
                    
                    try {
                        await axios.post(completeUrl, {}, { headers });
                    
                        const claimResponse = await axios.post(claimUrl, {}, { headers });
                        
                        if (claimResponse.data.message === "Reward claimed successfully") {
                            this.log(`Làm nhiệm vụ ${task.task_type} thành công | Nhận ${claimResponse.data.reward} CL`, 'success');
                        } else {
                            this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task_type}`, 'error');
                        }
                    } catch (error) {
//                        this.log(`Lỗi khi xử lý nhiệm vụ ${task.task_type}: ${error.message}`, 'error');
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 500) {
            } else {
//                this.log(`Lỗi khi xử lý nhiệm vụ hàng ngày: ${error.message}`, 'error');
            }
        }
    }

    async playGame(initData) {
        const headers = { ...this.headers, "Init-Data": initData };
        const baseUrl = "https://tonclayton.fun/api";
    
        while (true) {
            const loginResult = await this.login(initData);
            if (!loginResult.success) {
                this.log("Không kiểm tra được vé", 'error');
                return;
            }
    
            const tickets = loginResult.data.user.tickets;
            if (tickets <= 0) {
                this.log("Không còn vé nữa. dừng chơi game.", 'info');
                return;
            }

            let startAttempts = 0;
            let gameStarted = false;

            while (startAttempts < 1 && !gameStarted) {
                try {
                    const startGameResponse = await axios.post(`${baseUrl}/game/start-game`, {}, { headers });
                    if (startGameResponse.data.message === "Game started successfully") {
                        this.log("Trò chơi đã bắt đầu thành công", 'success');
                        gameStarted = true;
                    } else {
                        this.log("Không thể bắt đầu trò chơi", 'error');
                        startAttempts++;
                    }
                } catch (error) {
                    this.log(`Error starting game: ${error.message}`, 'error');
                    startAttempts++;
                }

                if (!gameStarted && startAttempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
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
    
                try {
                    const saveGameResponse = await axios.post(`${baseUrl}/game/save-tile-game`, { maxTile: milestone }, { headers });
                    if (saveGameResponse.data.message === "MaxTile saved successfully") {
                        this.log(`Đã đạt đến ô ${milestone}`, 'success');
                    } else {
                        this.log(`Failed to save tile ${milestone}`, 'error');
                    }
                } catch (error) {
                    this.log(`Error saving game state: ${error.message}`, 'error');
                }
            }
    
            try {
                const endGameResponse = await axios.post(`${baseUrl}/game/over-game`, {}, { headers });
                const reward = endGameResponse.data;
                this.log(`Trò chơi đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'custom');
            } catch (error) {
                this.log(`Error ending game: ${error.message}`, 'error');
            }
    
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    async main() {
        while (true) {
            const dataFile = path.join(__dirname, 'data.txt');
            const data = fs.readFileSync(dataFile, 'utf8')
                .replace(/\r/g, '')
                .split('\n')
                .filter(Boolean);
    
            for (let i = 0; i < data.length; i++) {
                const initData = data[i];
                const userData = JSON.parse(decodeURIComponent(initData.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;
    
                console.log(`========== Tài khoản ${i + 1} | ${firstName.green} ==========`);
                
                this.log(`Đang đăng nhập tài khoản...`, 'info');
                const loginResult = await this.login(initData);
                if (loginResult.success) {
                    this.log('Đăng nhập thành công!', 'success');
                    const userInfo = loginResult.data.user;
                    this.log(`Balance CL: ${userInfo.tokens}`, 'info');
                    this.log(`Vé: ${userInfo.daily_attempts}`, 'info');
    
                    if (loginResult.data.dailyReward.can_claim_today) {
                        this.log('Đang nhận phần thưởng hàng ngày...', 'info');
                        const claimResult = await this.dailyClaim(initData);
                        if (claimResult.success && claimResult.data.message === "daily reward claimed successfully") {
                            this.log('Điểm danh hàng ngày thành công!', 'success');
                        } else {
                            this.log(`Không thể nhận phần thưởng hàng ngày: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
                        }
                    } else {
                        this.log('Hôm nay bạn đã điểm danh rồi.', 'warning');
                    }
    
                    if (!userInfo.active_farm) {
                        this.log('Đang bắt đầu farm...', 'info');
                        const startResult = await this.startFarm(initData);
                        if (startResult.success) {
                            const finishTime = DateTime.fromISO(startResult.data.start_time).plus({ hours: 6 });
                            this.log(`Farm bắt đầu. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'success');
                            if (i === 0) {
                                this.firstAccountFarmEndTime = finishTime;
                            }
                        } else {
                            this.log(`Không thể bắt đầu farm: ${startResult.error || 'Lỗi không xác định'}`, 'error');
                        }
                    } else {
                        if (!userInfo.can_claim) {
                            const finishTime = DateTime.fromISO(userInfo.start_time).plus({ hours: 6 });
                            this.log(`Farm đang hoạt động. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'info');
                            if (i === 0) {
                                this.firstAccountFarmEndTime = finishTime;
                            }
                        } else {
                            this.log('Đang nhận phần thưởng farm...', 'info');
                            const claimResult = await this.claimFarm(initData);
                            if (claimResult.success) {
                                this.log(`Claim thành công. Nhận ${claimResult.data.claim} CL và ${claimResult.data.xp_earned} XP | Balance: ${claimResult.data.tokens}`, 'success');
                                
                                this.log('Đang bắt đầu farm mới...', 'info');
                                const startResult = await this.startFarm(initData);
                                if (startResult.success) {
                                    const finishTime = DateTime.fromISO(startResult.data.start_time).plus({ hours: 6 });
                                    this.log(`Farm mới bắt đầu. Thời gian hoàn thành: ${finishTime.toFormat('dd/MM/yyyy HH:mm:ss')}`, 'success');
                                    if (i === 0) {
                                        this.firstAccountFarmEndTime = finishTime;
                                    }
                                } else {
                                    this.log(`Không thể bắt đầu farm mới: ${startResult.error || 'Lỗi không xác định'}`, 'error');
                                }
                            } else {
                                this.log(`Không thể nhận phần thưởng farm: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
                            }
                        }
                    }
    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await this.handlePartnerTasks(initData);
                    await this.handleTwitterTask(initData);
                    await this.handleBotTask(initData);
                    await this.handleDailyTasks(initData);
                    if (userInfo.daily_attempts > 0) {
                        await this.playGame(initData);
                    } else {
                        this.log(`Không còn vé chơi game`, 'success');
                    }
                } else {
                    this.log(`Đăng nhập không thành công! ${loginResult.error}`, 'error');
                }
    
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
    
            if (this.firstAccountFarmEndTime) {
                const now = DateTime.now();
                const waitTime = this.firstAccountFarmEndTime.diff(now).as('seconds');
                if (waitTime > 0) {
                    this.log(`Chờ đến khi farm của tài khoản đầu tiên hoàn thành...`, 'info');
                    await this.countdown(Math.ceil(waitTime));
                }
            } else {
                this.log(`Không có thông tin về thời gian hoàn thành farm của tài khoản đầu tiên. Chờ 6 giờ...`, 'warning');
                await this.countdown(6 * 60 * 60);
            }
        }
    }
}

const client = new Clayton();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});