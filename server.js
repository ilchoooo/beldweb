const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Пожалуйста, заполните обязательные поля.' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim());
    const text = `🚀 Новая заявка с сайта beld.web!\n\nИмя: ${name}\nКонтакты: ${email}\nСообщение: ${message || 'Без сообщения'}`;

    try {
        const sendPromises = chatIds.map(chatId => 
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            }).then(res => res.json())
        );

        const results = await Promise.all(sendPromises);
        const allOk = results.every(res => res.ok);

        if (allOk) {
            res.json({ success: true, message: 'Заявка успешно отправлена!' });
        } else {
            console.error('Some Telegram API calls failed:', results);
            res.status(500).json({ error: 'Ошибка при отправке в Telegram некоторым получателям.' });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
