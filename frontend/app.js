document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('current-time');
    const ritualStatus = document.getElementById('ritual-status');
    const checkinBtn = document.getElementById('checkin-btn');
    const bgLayer = document.getElementById('bg-layer');
    const langSwitcher = document.getElementById('lang-switcher');
    const appBody = document.body;

    // Initialize Supabase Client
    const supabaseUrl = 'https://ezuwmfcslwmcswxghugq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dXdtZmNzbHdtY3N3eGdodWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjA3MzIsImV4cCI6MjA5NzQzNjczMn0.j921YcOErEXQCGUU9idoYAqdJItBQeYjNQhCDKOCx48';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    let currentUser = null;
    let currentProfile = null;

    // Translations
    const translations = {
        zh: {
            morning_ritual: "晨起仪式",
            start_day: "开启新的一天",
            streak: "坚持天数",
            fasting: "正在断食",
            community_feed: "社群动态",
            morning_checkin: "晨起打卡",
            post_1_content: "今天5点准时起来了！空气真的很好，准备去晨跑。大家一起加油！",
            encourage: "鼓励",
            discuss: "讨论",
            stats_title: "个人统计",
            total_checkins: "总打卡次数",
            weekly_report: "本周报告",
            my_posts: "我的发布",
            settings: "设置",
            help: "帮助中心",
            nav_home: "首页",
            nav_social: "广场",
            nav_post: "发布",
            nav_stats: "统计",
            nav_me: "我的",
            success_msg: "打卡成功！已同步至社群。"
        },
        en: {
            morning_ritual: "Morning Ritual",
            start_day: "Start New Day",
            streak: "Streak Days",
            fasting: "Fasting Now",
            community_feed: "Community Feed",
            morning_checkin: "Morning Rise",
            post_1_content: "Woke up at 5am sharp! The air is great, heading for a morning run. Let's go!",
            encourage: "Encourage",
            discuss: "Discuss",
            stats_title: "Personal Stats",
            total_checkins: "Total Check-ins",
            weekly_report: "Weekly Report",
            my_posts: "My Posts",
            settings: "Settings",
            help: "Help Center",
            nav_home: "Home",
            nav_social: "Square",
            nav_post: "Post",
            nav_stats: "Stats",
            nav_me: "Me",
            success_msg: "Check-in successful! Synced to community."
        },
        es: {
            morning_ritual: "Ritual Matutino",
            start_day: "Empezar el Día",
            streak: "Días de Racha",
            fasting: "Ayunando Ahora",
            community_feed: "Muro de la Comunidad",
            morning_checkin: "Amanecer",
            post_1_content: "¡Me desperté a las 5 am en punto! El aire es genial, voy a correr. ¡Vamos!",
            encourage: "Animar",
            discuss: "Discutir",
            stats_title: "Estadísticas",
            total_checkins: "Total de Registros",
            weekly_report: "Reporte Semanal",
            my_posts: "Mis Publicaciones",
            settings: "Ajustes",
            help: "Ayuda",
            nav_home: "Inicio",
            nav_social: "Plaza",
            nav_post: "Publicar",
            nav_stats: "Stats",
            nav_me: "Yo",
            success_msg: "¡Registro exitoso! Sincronizado con la comunidad."
        },
        ar: {
            morning_ritual: "طقوس الصباح",
            start_day: "بدء اليوم",
            streak: "أيام متتالية",
            fasting: "صائم الآن",
            community_feed: "خلاصة المجتمع",
            morning_checkin: "الاستيقاظ صباحاً",
            post_1_content: "استيقظت في الساعة 5 صباحاً بالضبط! الهواء رائع، سأذهب للجري الصباحي. هيا بنا!",
            encourage: "تشجيع",
            discuss: "مناقشة",
            stats_title: "الإحصائيات الشخصية",
            total_checkins: "إجمالي تسجيلات الدخول",
            weekly_report: "التقرير الأسبوعي",
            my_posts: "منشوراتي",
            settings: "الإعدادات",
            help: "مركز المساعدة",
            nav_home: "الرئيسية",
            nav_social: "الساحة",
            nav_post: "نشر",
            nav_stats: "الإحصائيات",
            nav_me: "أنا",
            success_msg: "تم تسجيل الدخول بنجاح! تم المزامنة مع المجتمع."
        }
    };

    function translateApp(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        
        // RTL Logic
        if (lang === 'ar') {
            appBody.classList.add('rtl');
        } else {
            appBody.classList.remove('rtl');
        }
    }

    langSwitcher.addEventListener('change', (e) => {
        translateApp(e.target.value);
    });

    // View Switching
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    function switchView(viewId) {
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        // Special case for Square view to scroll to top
        if (viewId === 'social') {
            window.scrollTo(0, 0);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const viewName = item.id.replace('nav-', '');
            
            // Require login for post and profile
            if ((viewName === 'add' || viewName === 'me') && !currentUser) {
                document.getElementById('auth-modal').style.display = 'flex';
                return;
            }

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            if (viewName !== 'add') {
                switchView(viewName);
            } else {
                document.getElementById('media-upload').click();
            }
        });
    });

    // Time Management
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;
        
        updateRitualState(now.getHours());
    }

    function updateRitualState(hour) {
        bgLayer.className = 'app-bg';
        const lang = langSwitcher.value;
        
        if (hour >= 5 && hour < 9) {
            ritualStatus.setAttribute('data-i18n', 'morning_ritual');
            checkinBtn.setAttribute('data-i18n', 'start_day');
            checkinBtn.style.background = 'linear-gradient(135deg, var(--primary-morning), #f97316)';
            bgLayer.classList.add('morning');
        } else if (hour >= 11 && hour < 18) {
            ritualStatus.textContent = hour < 12 ? 'Breakfast' : (hour < 16 ? 'Lunch' : 'Dinner');
            checkinBtn.textContent = 'Meal Check-in';
            checkinBtn.style.background = 'linear-gradient(135deg, var(--primary-fasting), #10b981)';
            bgLayer.classList.add('meal');
        } else if (hour >= 20 && hour < 21) {
            ritualStatus.textContent = '9SLEEP Ritual';
            checkinBtn.textContent = 'Prepare to Sleep';
            checkinBtn.style.background = 'linear-gradient(135deg, var(--primary-night), #4f46e5)';
            bgLayer.classList.add('night');
        } else {
            ritualStatus.textContent = 'Fasting Mode';
            checkinBtn.textContent = 'Record Moment';
            checkinBtn.style.background = 'linear-gradient(135deg, #475569, #1e293b)';
            bgLayer.classList.add('night');
        }
        translateApp(lang); // Re-apply translations if needed
    }

    checkinBtn.addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('auth-modal').style.display = 'flex';
            return;
        }
        const lang = langSwitcher.value;
        alert(translations[lang].success_msg);
        addMockPost(ritualStatus.textContent);
    });

    async function addMockPost(ritual) {
        try {
            await supabase.from('posts').insert([{ content: `Finished my ${ritual}! Feeling great! 💪`, media_url: '', media_type: '' }]);
            await loadPosts();
        } catch(e) {
            console.error(e);
        }
    }

    // Media Posting Logic
    const mediaUpload = document.getElementById('media-upload');
    const postModal = document.getElementById('post-modal');
    const mediaPreviewImg = document.getElementById('media-preview-img');
    const mediaPreviewVid = document.getElementById('media-preview-vid');
    const mediaPreviewContainer = document.getElementById('media-preview-container');
    const removeMediaBtn = document.getElementById('remove-media-btn');
    const cancelPostBtn = document.getElementById('cancel-post-btn');
    const submitPostBtn = document.getElementById('submit-post-btn');
    const postCaption = document.getElementById('post-caption');
    
    let currentMediaUrl = null;
    let currentMediaType = null;

    mediaUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            currentMediaUrl = URL.createObjectURL(file);
            currentMediaType = file.type.startsWith('video/') ? 'video' : 'image';
            
            mediaPreviewImg.style.display = 'none';
            mediaPreviewVid.style.display = 'none';
            
            if (currentMediaType === 'video') {
                mediaPreviewVid.src = currentMediaUrl;
                mediaPreviewVid.style.display = 'block';
            } else {
                mediaPreviewImg.src = currentMediaUrl;
                mediaPreviewImg.style.display = 'block';
            }
            
            mediaPreviewContainer.style.display = 'block';
            postModal.style.display = 'flex';
        }
    });

    removeMediaBtn.addEventListener('click', () => {
        mediaPreviewContainer.style.display = 'none';
        mediaUpload.value = '';
        currentMediaUrl = null;
        currentMediaType = null;
        postModal.style.display = 'none';
    });

    cancelPostBtn.addEventListener('click', () => {
        postModal.style.display = 'none';
        mediaUpload.value = '';
        postCaption.value = '';
        currentMediaUrl = null;
    });

    submitPostBtn.addEventListener('click', async () => {
        if (!currentMediaUrl && !postCaption.value.trim()) return;
        
        submitPostBtn.textContent = '发布中...';
        submitPostBtn.disabled = true;

        let media_url = "";
        let media_type = "";

        try {
            const file = mediaUpload.files[0];
            if (file) {
                const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(filename, file);
                
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('media').getPublicUrl(filename);
                media_url = data.publicUrl;
                media_type = file.type.startsWith('video') ? 'video' : 'image';
            }

            const { error: dbError } = await supabase
                .from('posts')
                .insert([{ content: postCaption.value, media_url, media_type }]);
            
            if (dbError) throw dbError;
            
            await loadPosts();
            
            // Cleanup
            postModal.style.display = 'none';
            mediaUpload.value = '';
            postCaption.value = '';
            currentMediaUrl = null;
            
            // Switch to social view
            document.getElementById('nav-social').click();
        } catch (error) {
            console.error(error);
            alert('发布失败，请检查网络');
        } finally {
            submitPostBtn.textContent = '发布';
            submitPostBtn.disabled = false;
        }
    });

    async function loadPosts() {
        try {
            // Join with profiles table to get author details
            const { data: posts, error } = await supabase
                .from('posts')
                .select('*, profiles(nickname, avatar_url)')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            const feedList = document.getElementById('feed-list');
            feedList.innerHTML = '';
            
            posts.forEach(post => {
                const newPost = document.createElement('div');
                newPost.className = 'post glass animate-in';
                
                let mediaHtml = '';
                if (post.media_url) {
                    if (post.media_type === 'video') {
                        mediaHtml = `<video src="${post.media_url}" controls style="width: 100%; border-radius: 8px; margin-bottom: 12px;"></video>`;
                    } else {
                        mediaHtml = `<img src="${post.media_url}" style="width: 100%; border-radius: 8px; margin-bottom: 12px;">`;
                    }
                }

                const date = new Date(post.created_at);
                const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Get profile details or fallbacks
                const authorName = post.profiles?.nickname || '匿名用户';
                const authorAvatar = post.profiles?.avatar_url 
                    ? `url(${post.profiles.avatar_url})` 
                    : 'linear-gradient(135deg, #fb923c, #6366f1)';

                newPost.innerHTML = `
                    <div class="post-header">
                        <div class="avatar" style="background: ${authorAvatar}; background-size: cover; background-position: center;"></div>
                        <div>
                            <p class="username">${authorName}</p>
                            <p style="font-size: 10px; color: var(--text-muted);">${timeString}</p>
                        </div>
                    </div>
                    <div class="post-content">
                        ${post.content}
                    </div>
                    ${mediaHtml}
                    <div class="post-actions">
                        <span>👏 0</span>
                        <span>💬 0</span>
                    </div>
                `;
                feedList.appendChild(newPost);
            });
        } catch (error) {
            console.error("Error loading posts:", error);
        }
    }

    // ==========================================
    // AUTH & PROFILE LOGIC
    // ==========================================
    
    // Auth DOM Elements
    const authModal = document.getElementById('auth-modal');
    const authEmail = document.getElementById('auth-email');
    const authOtp = document.getElementById('auth-otp');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const authStep1 = document.getElementById('auth-step-1');
    const authStep2 = document.getElementById('auth-step-2');
    const backToEmailBtn = document.getElementById('back-to-email-btn');

    // Profile DOM Elements
    const profileAvatar = document.getElementById('profile-avatar');
    const profileNickname = document.getElementById('profile-nickname');
    const profileEmail = document.getElementById('profile-email');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');
    const signOutBtn = document.getElementById('sign-out-btn');

    // 1. Listen for Auth State Changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            currentUser = session.user;
            authModal.style.display = 'none';
            await loadProfile();
            loadPosts(); // Reload to show updated names if any changed
        } else {
            currentUser = null;
            currentProfile = null;
            // Optionally auto-show modal, but we handle it via nav clicks
        }
    });

    // 2. Auth Actions
    sendOtpBtn.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        if (!email) return alert('请输入邮箱');
        sendOtpBtn.textContent = '发送中...';
        sendOtpBtn.disabled = true;
        
        const { error } = await supabase.auth.signInWithOtp({ email });
        sendOtpBtn.textContent = '发送验证码';
        sendOtpBtn.disabled = false;
        
        if (error) {
            alert('发送失败: ' + error.message);
        } else {
            authStep1.style.display = 'none';
            authStep2.style.display = 'block';
        }
    });

    verifyOtpBtn.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        const token = authOtp.value.trim();
        if (!token) return alert('请输入验证码');
        verifyOtpBtn.textContent = '验证中...';
        verifyOtpBtn.disabled = true;
        
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
        verifyOtpBtn.textContent = '验证并登录';
        verifyOtpBtn.disabled = false;
        
        if (error) {
            alert('验证码错误: ' + error.message);
        } else {
            authOtp.value = '';
            authStep1.style.display = 'block';
            authStep2.style.display = 'none';
        }
    });

    backToEmailBtn.addEventListener('click', () => {
        authStep1.style.display = 'block';
        authStep2.style.display = 'none';
    });

    signOutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        alert('已退出登录');
        document.getElementById('nav-home').click();
    });

    // 3. Profile Actions
    async function loadProfile() {
        if (!currentUser) return;
        profileEmail.textContent = currentUser.email;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
        if (error) {
            console.error('加载资料失败', error);
            return;
        }
        currentProfile = data;
        profileNickname.textContent = data.nickname || '新用户';
        if (data.avatar_url) {
            profileAvatar.style.backgroundImage = `url(${data.avatar_url})`;
        } else {
            profileAvatar.style.backgroundImage = 'linear-gradient(135deg, #fb923c, #6366f1)';
        }
    }

    editNicknameBtn.addEventListener('click', async () => {
        const newName = prompt('请输入新昵称:', profileNickname.textContent);
        if (newName && newName.trim() !== '') {
            const { error } = await supabase
                .from('profiles')
                .update({ nickname: newName.trim() })
                .eq('id', currentUser.id);
                
            if (error) {
                alert('更新失败: ' + error.message);
            } else {
                await loadProfile();
                loadPosts(); // Refresh feed to update UI
            }
        }
    });

    avatarUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        profileAvatar.style.opacity = '0.5';
        
        const filename = `${currentUser.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, file);
        
        if (uploadError) {
            alert('上传头像失败: ' + uploadError.message);
            profileAvatar.style.opacity = '1';
            return;
        }
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filename);
        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', currentUser.id);
        
        await loadProfile();
        loadPosts(); // Refresh feed
        profileAvatar.style.opacity = '1';
    });

    // Init
    loadPosts();
    setInterval(updateClock, 1000);
    updateClock();
    translateApp('zh');
});
