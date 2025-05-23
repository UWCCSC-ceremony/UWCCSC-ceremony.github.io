// Initialize Supabase
const SUPABASE_URL = 'https://wzwvsbgmiisxloyfkqdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3ZzYmdtaWlzeGxveWZrcWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDI0OTIsImV4cCI6MjA2MzQ3ODQ5Mn0.ZbwYwH2TW4nFUUEzaIhWKZfXitDGcUEcmOwXf9Ryay4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate QR Code
function getBaseURL() {
    return window.location.origin;
}

// Light color palette for messages
const colors = [
    '#FF9A76', '#FF7676', '#C5E07F', '#72D6A0', '#92CFEF',
    '#FFA4B2', '#D4E684', '#5EC3B9', '#8B9CD9', '#E48DB3',
    '#FFC97E', '#6FAED6', '#F5A6C8', '#94DFA3', '#FFB38A',
    '#86AAD5', '#D1A5FF', '#A2DFDF', '#F1C76D', '#9FBABB'
];

// Variables for message queue
let messageQueue = [];
let isAnimating = false;
let messageElements = [];
let playedMessageIds = new Set();
let queueProcessingInterval = null;

// Start continuous queue processing
function startMessageProcessing() {
    // Start processing the queue immediately and continuously
    queueProcessingInterval = setInterval(() => {
        if (!isAnimating && messageQueue.length > 0) {
            processQueue();
        }
    }, 100); // Check queue every 100ms
}

// Function to get a random color
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Function to get a random Y position (avoiding top and bottom edges)
function getRandomYPosition() {
    return 10 + Math.random() * 70; // 10% to 80% of viewport height
}

// Function to record a message as played
async function recordPlayedMessage(messageId) {
    try {
        const { error } = await supabase
            .from('played')
            .insert([{ id: messageId }]);

        if (error) {
            console.error('Error recording played message:', error);
            throw error;
        }
        playedMessageIds.add(messageId);
    } catch (error) {
        console.error('Error recording played message:', error);
    }
}

// Function to get already played messages
async function fetchPlayedMessages() {
    try {
        const { data, error } = await supabase
            .from('played')
            .select('id');

        if (error) {
            console.error('Error fetching played messages:', error);
            throw error;
        }

        if (data && data.length > 0) {
            data.forEach(item => {
                playedMessageIds.add(item.id);
            });
        }
    } catch (error) {
        console.error('Error fetching played messages:', error);
    }
}

// Function to animate a message
function animateMessage(messageElement, duration, callback) {
    const startTime = performance.now();
    const containerWidth = document.getElementById('message-container').clientWidth;

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Move from left to right
        const translateX = (containerWidth * progress);
        messageElement.style.transform = `translateX(${translateX}px)`;

        // Fade out when near the end
        if (progress > 0.9) {
            messageElement.style.opacity = 1 - (progress - 0.9) * 10;
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            messageElement.remove();
            if (callback) callback();
        }
    }

    requestAnimationFrame(step);
}

// Function to process queue
function processQueue() {
    if (messageQueue.length === 0 || isAnimating) {
        return;
    }

    isAnimating = true;
    const messageData = messageQueue.shift();

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = messageData.text;
    messageElement.style.top = `${getRandomYPosition()}%`;
    messageElement.style.backgroundColor = getRandomColor();
    if (messageData.id) {
        messageElement.dataset.id = messageData.id;
    }

    document.getElementById('message-container').appendChild(messageElement);
    messageElements.push(messageElement);

    if (messageData.id) {
        recordPlayedMessage(messageData.id);
    }

    messageElement.offsetHeight; // Force layout calculation

    const duration = 30000; // 30 seconds animation duration
    animateMessage(messageElement, duration, () => {
        messageElements = messageElements.filter(el => el !== messageElement);
        isAnimating = false;
    });
}

// Function to fetch messages from Supabase
async function fetchMessages() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .gte('timestamp', fiveMinutesAgo)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        if (data && data.length > 0) {
            // Add new messages to queue that haven't been played
            data.forEach(message => {
                if (!playedMessageIds.has(message.id.toString()) &&
                    !messageQueue.some(m => m.id === message.id) &&
                    !messageElements.some(el => el.dataset.id === message.id.toString())) {
                    messageQueue.push(message);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Set up real-time subscription
function setupRealtime() {
    const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, payload => {
            if (!playedMessageIds.has(payload.new.id.toString())) {
                messageQueue.push(payload.new);
            }
        })
        .subscribe();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    const submitURL = `${getBaseURL()}/submit`;
    new QRCode(document.getElementById("qrcode"), {
        text: submitURL,
        width: 100,
        height: 100
    });
    
    await fetchPlayedMessages();
    fetchMessages();
    setupRealtime();
    startMessageProcessing();
    
    // Set up periodic message fetching
    setInterval(fetchMessages, 30000);
}); 