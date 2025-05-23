// Initialize Parse
Parse.initialize("zdPwa6EIi5IdVpvjOjndO2CDDF9ExtxRJaMHnY9v", "LQvNGqWYAmguTbiHx4jppJezHdMJJvEwU3XOIyAn");
Parse.serverURL = "https://parseapi.back4app.com/";

// Enable Live Query
Parse.liveQueryServerURL = 'wss://parseapi.back4app.com';

// Constants
const MAX_MESSAGES_ON_SCREEN = 30;
const MESSAGE_ANIMATION_DURATION = 30000; // 30 seconds
const MESSAGE_SPAWN_INTERVAL = 1000; // 1 seconds between messages
const FETCH_INTERVAL = 1000; // 1 second
const PLAN_B_START_TIME = 25000; // 25 seconds
const POSITION_MEMORY_SIZE = 5; // Remember last 5 message positions
const MIN_Y_POSITION = 10; // Minimum Y position (%)
const MAX_Y_POSITION = 90; // Maximum Y position (%)
const SAFE_MARGIN = 8; // Vertical margin around messages (%)

// Light color palette for messages
const colors = [
    '#FF9A76', '#FF7676', '#C5E07F', '#72D6A0', '#92CFEF',
    '#FFA4B2', '#D4E684', '#5EC3B9', '#8B9CD9', '#E48DB3',
    '#FFC97E', '#6FAED6', '#F5A6C8', '#94DFA3', '#FFB38A',
    '#86AAD5', '#D1A5FF', '#A2DFDF', '#F1C76D', '#9FBABB'
];

// State management
let playedMessageIds = new Set();
let activeMessageElements = new Set();
let lastMessageTime = 0;
let lastPlanBTime = 0;
let isInitialized = false;
let isStarted = false;
let planBMessages = [];
let usedPlanBMessages = new Set();
let planBCheckInterval = null;
let startTime = 0;
let recentMessagePositions = [];

// Function to save played message IDs to session storage
function savePlayedMessages() {
    sessionStorage.setItem('playedMessageIds', JSON.stringify([...playedMessageIds]));
}

// Function to load played message IDs from session storage
function loadPlayedMessages() {
    const saved = sessionStorage.getItem('playedMessageIds');
    if (saved) {
        playedMessageIds = new Set(JSON.parse(saved));
    }
}

// Class to track message position information
class MessagePosition {
    constructor(yPosition, height) {
        this.yPosition = yPosition;
        this.height = height;
        this.timestamp = Date.now();
    }

    // Check if this position overlaps with a given y-range
    overlaps(y, margin) {
        const thisTop = this.yPosition - margin;
        const thisBottom = this.yPosition + this.height + margin;
        const otherTop = y - margin;
        const otherBottom = y + margin;
        return !(thisBottom < otherTop || thisTop > otherBottom);
    }

    // Check if the position is still relevant (within animation duration)
    isRelevant() {
        return (Date.now() - this.timestamp) < MESSAGE_ANIMATION_DURATION;
    }
}

// Function to get a safe Y position for a new message
function getSafeYPosition() {
    // Clean up expired positions
    recentMessagePositions = recentMessagePositions.filter(pos => pos.isRelevant());

    // If no recent messages, just return a random position
    if (recentMessagePositions.length === 0) {
        return MIN_Y_POSITION + Math.random() * (MAX_Y_POSITION - MIN_Y_POSITION);
    }

    // Try to find a safe position
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        const candidateY = MIN_Y_POSITION + Math.random() * (MAX_Y_POSITION - MIN_Y_POSITION);
        let isPositionSafe = true;

        // Check against all recent positions
        for (const position of recentMessagePositions) {
            if (position.overlaps(candidateY, SAFE_MARGIN)) {
                isPositionSafe = false;
                break;
            }
        }

        if (isPositionSafe) {
            return candidateY;
        }

        attempts++;
    }

    // If we couldn't find a completely safe position, find the position with maximum spacing
    let bestPosition = MIN_Y_POSITION;
    let maxMinDistance = 0;

    for (let y = MIN_Y_POSITION; y <= MAX_Y_POSITION; y += 5) {
        let minDistance = Number.MAX_VALUE;
        for (const position of recentMessagePositions) {
            const distance = Math.abs(y - position.yPosition);
            minDistance = Math.min(minDistance, distance);
        }
        if (minDistance > maxMinDistance) {
            maxMinDistance = minDistance;
            bestPosition = y;
        }
    }

    return bestPosition;
}

// Function to get a random color
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Function to load Plan B messages
async function loadPlanBMessages() {
    try {
        const response = await fetch('planb.txt');
        if (!response.ok) {
            throw new Error('Failed to load planb.txt');
        }
        const text = await response.text();
        planBMessages = text.split('\n')
            .map(msg => msg.trim())
            .filter(msg => msg.length > 0);
    } catch (error) {
        console.error('Error loading Plan B messages:', error);
        // Fallback messages if planb.txt fails to load
        planBMessages = [
            "Congratulations to all graduates!",
            "Your hard work has paid off!",
            "The future belongs to you!",
            "Dream big and achieve bigger!",
            "Today is just the beginning!"
        ];
    }
}

// Function to get a random Plan B message
function getRandomPlanBMessage() {
    const availableMessages = planBMessages.filter(msg => !usedPlanBMessages.has(msg));
    if (availableMessages.length === 0) {
        // Reset used messages if all have been used
        usedPlanBMessages.clear();
        return planBMessages[Math.floor(Math.random() * planBMessages.length)];
    }
    const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    usedPlanBMessages.add(message);
    return message;
}

// Function to check and add Plan B message if needed
function checkAndAddPlanBMessage() {
    if (!isStarted) return;
    
    const currentTime = Date.now();
    const timeElapsed = currentTime - startTime;
    
    if (timeElapsed < PLAN_B_START_TIME) return;
    
    if (currentTime - lastPlanBTime >= MESSAGE_SPAWN_INTERVAL) {
        if (canShowMoreMessages()) {
            const planBMessage = {
                id: `planb-${Date.now()}`,
                text: getRandomPlanBMessage(),
                isPlanB: true
            };
            createAndAnimateMessage(planBMessage);
            lastPlanBTime = currentTime;
        }
    }
}

// Function to record a message as played
function recordPlayedMessage(messageId) {
    playedMessageIds.add(messageId);
    savePlayedMessages();
}

// Function to create and animate a message
function createAndAnimateMessage(messageData) {
    if (!isStarted) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = messageData.text;
    
    // Create temporary element to measure height
    const tempElement = messageElement.cloneNode(true);
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.height = 'auto';
    document.body.appendChild(tempElement);
    const height = tempElement.offsetHeight;
    document.body.removeChild(tempElement);

    // Get safe Y position and store position information
    const yPosition = getSafeYPosition();
    messageElement.style.top = `${yPosition}%`;
    messageElement.style.backgroundColor = getRandomColor();
    messageElement.dataset.id = messageData.id;

    // Store position information
    const messagePosition = new MessagePosition(yPosition, (height / window.innerHeight) * 100);
    recentMessagePositions.push(messagePosition);
    if (recentMessagePositions.length > POSITION_MEMORY_SIZE) {
        recentMessagePositions.shift();
    }

    document.getElementById('message-container').appendChild(messageElement);
    activeMessageElements.add(messageElement);

    // Only record non-Plan B messages as played
    if (!messageData.isPlanB) {
        recordPlayedMessage(messageData.id);
    }

    // Remove message after animation completes
    setTimeout(() => {
        messageElement.remove();
        activeMessageElements.delete(messageElement);
    }, MESSAGE_ANIMATION_DURATION);
}

// Function to check if we can show more messages
function canShowMoreMessages() {
    return activeMessageElements.size < MAX_MESSAGES_ON_SCREEN;
}

// Function to check if enough time has passed since last message
function canSpawnNewMessage() {
    return Date.now() - lastMessageTime >= MESSAGE_SPAWN_INTERVAL;
}

// Set up real-time subscription
async function setupRealtime() {
    try {
        const Message = Parse.Object.extend("Message");
        const query = new Parse.Query(Message);
        
        // Subscribe to new messages
        const subscription = await query.subscribe();
        
        subscription.on('create', (message) => {
            if (isStarted && 
                !playedMessageIds.has(message.id) && 
                canShowMoreMessages() && 
                canSpawnNewMessage()) {
                createAndAnimateMessage({
                    id: message.id,
                    text: message.get("text"),
                    isPlanB: false
                });
                lastMessageTime = Date.now();
            }
        });

        console.log('Live Query subscription successful');
    } catch (error) {
        console.error('Live Query subscription error:', error);
        // Continue initialization even if real-time fails
        return;
    }
}

// Function to fetch and process messages
async function fetchAndProcessMessages() {
    if (!isStarted) return;

    try {
        const Message = Parse.Object.extend("Message");
        const query = new Parse.Query(Message);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        query.greaterThanOrEqualTo("createdAt", fiveMinutesAgo);
        query.ascending("createdAt");
        query.limit(100); // Add a reasonable limit
        
        const results = await query.find();
        
        if (results.length > 0) {
            for (const message of results) {
                const messageId = message.id;
                if (!playedMessageIds.has(messageId) && 
                    canShowMoreMessages() && 
                    canSpawnNewMessage()) {
                    createAndAnimateMessage({
                        id: messageId,
                        text: message.get("text"),
                        isPlanB: false
                    });
                    lastMessageTime = Date.now();
                }
            }
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Function to start the system
function startSystem() {
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.style.display = 'none';
    }
    isStarted = true;
    startTime = Date.now();
    lastPlanBTime = startTime;
    
    planBCheckInterval = setInterval(checkAndAddPlanBMessage, MESSAGE_SPAWN_INTERVAL);
}

// Initialize the system
async function initializeSystem() {
    if (isInitialized) return;
    
    try {
        loadPlayedMessages();
        await loadPlanBMessages();
        
        // Start periodic message fetching first
        setInterval(fetchAndProcessMessages, FETCH_INTERVAL);
        
        // Then try to set up real-time (but don't block on it)
        setupRealtime().catch(console.error);
        
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', startSystem);
        }
        
        isInitialized = true;
    } catch (error) {
        console.error('Error initializing system:', error);
        setTimeout(initializeSystem, 1000);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeSystem); 