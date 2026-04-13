<?php
/**
 * beld.web — Форма обратной связи для PHP
 */

// 1. Простая функция для парсинга .env файла
function loadEnv($path) {
    if (!file_exists($path)) return false;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . "=" . trim($value));
    }
}

// Загружаем переменные из .env
loadEnv(__DIR__ . '/.env');

// Получаем JSON из тела запроса
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Заголовки ответа
header('Content-Type: application/json');

if (!$data || empty($data['name']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Пожалуйста, заполните обязательные поля.']);
    exit;
}

$name = htmlspecialchars($data['name']);
$email = htmlspecialchars($data['email']);
$message = isset($data['message']) ? htmlspecialchars($data['message']) : 'Без сообщения';

$token = getenv('TELEGRAM_BOT_TOKEN');
$chatIdsString = getenv('TELEGRAM_CHAT_ID');
$chatIds = array_map('trim', explode(',', $chatIdsString));

$text = "🚀 Новая заявка с сайта beld.web!\n\n" .
        "Имя: $name\n" .
        "Контакты: $email\n" .
        "Сообщение: $message";

$successCount = 0;

foreach ($chatIds as $chatId) {
    if (empty($chatId)) continue;
    
    $url = "https://api.telegram.org/bot$token/sendMessage";
    $params = [
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    $response = curl_exec($ch);
    $result = json_decode($response, true);
    curl_close($ch);

    if ($result && isset($result['ok']) && $result['ok']) {
        $successCount++;
    }
}

if ($successCount > 0) {
    echo json_encode(['success' => true, 'message' => 'Заявка успешно отправлена!']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при отправке в Telegram.']);
}
