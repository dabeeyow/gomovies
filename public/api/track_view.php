<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$views_file = 'views.txt';

// Initialize views file if it doesn't exist
if (!file_exists($views_file)) {
    file_put_contents($views_file, json_encode([]));
}

// Handle POST request to track view
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = isset($input['type']) ? preg_replace('/[^a-z]/', '', strtolower($input['type'])) : null; // Sanitize to 'movie' or 'tv'
    $item_id = isset($input['id']) ? preg_replace('/[^0-9]/', '', $input['id']) : null;

    if (!$type || !in_array($type, ['movie', 'tv']) || !$item_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type or ID']);
        exit;
    }

    $key = $type . '_' . $item_id;

    // Read current views
    $views_data = json_decode(file_get_contents($views_file), true);
    if (!is_array($views_data)) {
        $views_data = [];
    }

    // Increment view count
    $views_data[$key] = isset($views_data[$key]) ? $views_data[$key] + 1 : 1;

    // Save updated views
    file_put_contents($views_file, json_encode($views_data, JSON_PRETTY_PRINT));

    echo json_encode(['success' => true, 'views' => $views_data[$key]]);
    exit;
}

// Handle GET request to fetch views for specific item
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['type']) && isset($_GET['id'])) {
    $type = isset($_GET['type']) ? preg_replace('/[^a-z]/', '', strtolower($_GET['type'])) : null;
    $item_id = isset($_GET['id']) ? preg_replace('/[^0-9]/', '', $_GET['id']) : null;

    if (!$type || !in_array($type, ['movie', 'tv']) || !$item_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type or ID']);
        exit;
    }

    $key = $type . '_' . $item_id;

    // Read current views
    $views_data = json_decode(file_get_contents($views_file), true);
    if (!is_array($views_data)) {
        $views_data = [];
    }

    $views = isset($views_data[$key]) ? $views_data[$key] : 0;

    echo json_encode(['views' => $views]);
    exit;
}

// Handle GET request to fetch most viewed (new endpoint)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['type'])) {
    // Read current views
    $views_data = json_decode(file_get_contents($views_file), true);
    if (!is_array($views_data)) {
        $views_data = [];
    }

    // Separate movies and TV shows
    $movieViews = [];
    $tvViews = [];
    foreach ($views_data as $key => $count) {
        if (strpos($key, 'movie_') === 0) {
            $movieId = substr($key, 6);
            $movieViews[$movieId] = $count;
        } elseif (strpos($key, 'tv_') === 0) {
            $tvId = substr($key, 3);
            $tvViews[$tvId] = $count;
        }
    }

    // Sort by views descending
    arsort($movieViews);
    arsort($tvViews);

    // Return top 10
    $mostViewedMovies = array_slice(array_keys($movieViews), 0, 10);
    $mostViewedTvShows = array_slice(array_keys($tvViews), 0, 10);

    echo json_encode([
        'movies' => $mostViewedMovies,
        'tv' => $mostViewedTvShows
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>