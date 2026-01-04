// Mock data for shows
window.showData = [
    {
        id: '1',
        name: 'Tech Talk Live',
        description: 'Weekly tech discussions with industry experts and innovators. We cover the latest in software development, AI, and emerging technologies.',
        category: 'tech',
        date: '2024-02-15',
        time: '8:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'Twitch'],
        host: 'Alex Chen',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '2',
        name: 'Gaming Legends',
        description: 'Interviews with top gamers, streamers, and esports professionals. Learn about their journey and gaming strategies.',
        category: 'gaming',
        date: '2024-02-18',
        time: '7:00 PM EST',
        platform: 'Twitch',
        platforms: ['Twitch', 'YouTube'],
        host: 'Sarah Martinez',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '3',
        name: 'Business Builders',
        description: 'Entrepreneurs share their success stories, failures, and lessons learned. Perfect for aspiring business owners.',
        category: 'business',
        date: '2024-02-20',
        time: '6:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'LinkedIn'],
        host: 'Michael Johnson',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '4',
        name: 'Lifestyle Lounge',
        description: 'Conversations about wellness, travel, fashion, and living your best life. Join us for inspiring stories.',
        category: 'lifestyle',
        date: '2024-02-22',
        time: '5:00 PM EST',
        platform: 'Instagram',
        platforms: ['Instagram', 'TikTok', 'YouTube'],
        host: 'Emma Wilson',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '5',
        name: 'Entertainment Tonight',
        description: 'Celebrity interviews, movie reviews, and pop culture discussions. Your weekly dose of entertainment news.',
        category: 'entertainment',
        date: '2024-02-25',
        time: '9:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'TikTok'],
        host: 'David Lee',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '6',
        name: 'Code & Coffee',
        description: 'Casual coding sessions and tech discussions. Perfect for developers looking to learn and share knowledge.',
        category: 'tech',
        date: '2024-02-28',
        time: '10:00 AM EST',
        platform: 'Twitch',
        platforms: ['Twitch', 'YouTube'],
        host: 'Jordan Kim',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '7',
        name: 'Streamer Spotlight',
        description: 'Weekly showcase of up-and-coming streamers and content creators. Discover new talent in the streaming world.',
        category: 'gaming',
        date: '2024-03-01',
        time: '8:00 PM EST',
        platform: 'Twitch',
        platforms: ['Twitch', 'Kick'],
        host: 'Taylor Swift',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '8',
        name: 'Learn & Grow',
        description: 'Educational content covering various topics from science to history. Expand your knowledge with expert guests.',
        category: 'education',
        date: '2024-03-03',
        time: '3:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube'],
        host: 'Dr. Maria Garcia',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '9',
        name: 'Fitness & Wellness',
        description: 'Health and fitness experts share tips, routines, and motivation. Transform your lifestyle with actionable advice.',
        category: 'lifestyle',
        date: '2024-03-05',
        time: '7:00 PM EST',
        platform: 'Instagram',
        platforms: ['Instagram', 'YouTube'],
        host: 'Chris Anderson',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '10',
        name: 'Startup Stories',
        description: 'Founders of successful startups share their journey from idea to IPO. Learn from real-world experiences.',
        category: 'business',
        date: '2024-03-08',
        time: '6:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'LinkedIn'],
        host: 'Rachel Green',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '11',
        name: 'Music Makers',
        description: 'Interviews with musicians, producers, and industry professionals. Explore the world of music creation.',
        category: 'entertainment',
        date: '2024-03-10',
        time: '8:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'TikTok'],
        host: 'Jamie Fox',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: '12',
        name: 'AI Insights',
        description: 'Deep dives into artificial intelligence, machine learning, and the future of technology. Expert discussions.',
        category: 'tech',
        date: '2024-03-12',
        time: '4:00 PM EST',
        platform: 'YouTube',
        platforms: ['YouTube', 'Twitch'],
        host: 'Dr. Alan Turing',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
];

// Mock data for talent
window.talentData = [
    {
        id: '1',
        name: 'John Smith',
        expertise: ['Tech', 'Programming', 'AI'],
        bio: 'Software engineer with 10+ years of experience in full-stack development and AI research.',
        avatar: 'JS'
    },
    {
        id: '2',
        name: 'Maria Rodriguez',
        expertise: ['Business', 'Entrepreneurship', 'Marketing'],
        bio: 'Serial entrepreneur and marketing strategist helping startups scale their businesses.',
        avatar: 'MR'
    },
    {
        id: '3',
        name: 'David Kim',
        expertise: ['Gaming', 'Esports', 'Streaming'],
        bio: 'Professional gamer and content creator with millions of followers across platforms.',
        avatar: 'DK'
    },
    {
        id: '4',
        name: 'Sarah Johnson',
        expertise: ['Lifestyle', 'Wellness', 'Fitness'],
        bio: 'Certified fitness trainer and wellness coach promoting healthy living.',
        avatar: 'SJ'
    },
    {
        id: '5',
        name: 'Michael Chen',
        expertise: ['Education', 'Science', 'Research'],
        bio: 'PhD in Physics and science communicator making complex topics accessible.',
        avatar: 'MC'
    },
    {
        id: '6',
        name: 'Emma Davis',
        expertise: ['Entertainment', 'Music', 'Arts'],
        bio: 'Musician and entertainment industry professional with a passion for the arts.',
        avatar: 'ED'
    }
];

// Helper function to get shows by date
window.getShowsByDate = function(dateString) {
    return window.showData.filter(show => show.date === dateString);
};

// Helper function to format date for display
window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

