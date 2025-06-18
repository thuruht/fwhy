const API_BASE = '/bl10g';
let sessionToken = sessionStorage.getItem("sessionToken");
let editingPostId = null;

// DOM Elements
const publicPostsListEl = document.getElementById('public-posts-list');
const publicFeaturedContentEl = document.getElementById('public-featured-content');
const adminPostsListEl = document.getElementById('admin-posts-list');
const adminFeaturedContentEl = document.getElementById('admin-featured-content');
const currentFeaturedTextEl = document.getElementById('current-featured-text');
const currentFeaturedYoutubeEl = document.getElementById('current-featured-youtube');
const currentFeaturedPreviewEl = document.getElementById('current-featured-preview');
const featuredForm = document.getElementById('featured-form');
const featuredTextEl = document.getElementById('featured-text');
const youtubeUrlInput = document.getElementById('youtube-url');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginPasswordEl = document.getElementById('password');
const loginErrorEl = document.getElementById('login-error');
const cancelLoginBtn = document.getElementById('cancel-login-btn');
const postForm = document.getElementById('post-form');
const postIdInput = document.getElementById('post-id');
const postTitleEl = document.getElementById('post-title');
const editorContainer = document.getElementById('editor-container');
const postImageUploadInput = document.getElementById('post-image-upload');
const postImagePreviewEl = document.getElementById('post-image-preview');
const postImageUrlDisplayEl = document.getElementById('post-image-url-display');
const removePostImageBtn = document.getElementById('remove-post-image-btn');
const postImageUrlInput = document.getElementById('post-image-url');
const postUploadProgressEl = document.getElementById('upload-progress');
const formHeadingEl = document.getElementById('form-heading');
const submitPostBtn = document.getElementById('submit-post-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Quill Editor Initialization
let postEditor;
if (editorContainer) {
    postEditor = new Quill('#editor-container', {
        theme: "snow",
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"]
            ]
        }
    });
}

function createYouTubeEmbed(url) {
    try {
        const videoId = new URL(url).searchParams.get('v');
        if (!videoId) return '';
        return `<div class="embed-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">
                  <iframe src="https://www.youtube.com/embed/${videoId}" 
                    style="position:absolute;top:0;left:0;width:100%;height:100%;" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
                </div>`;
    } catch {
        return '<p>Invalid YouTube URL</p>';
    }
}

let inactivityTimer;

function resetAuthTimer() {
    clearTimeout(inactivityTimer);
    if (sessionToken) {
        inactivityTimer = setTimeout(handleLogout, 1800000);
    }
}

function handleLogout() {
    sessionStorage.removeItem("sessionToken");
    sessionToken = null;
    alert("Logged out due to inactivity");
    updateView();
}

document.addEventListener('mousemove', resetAuthTimer);
document.addEventListener('keydown', resetAuthTimer);

async function fetchApi(endpoint, options = {}, isRetry = false) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (sessionToken && !options.excludeAuth) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 401 && !isRetry) {
                sessionStorage.removeItem("sessionToken");
                sessionToken = null;
                updateView();
                alert("Session expired - please login again");
            }
            const error = new Error(errorData.error || `Request failed: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return response.status === 204 ? { success: true } : await response.json();
    } catch (error) {
        console.error(`API Error: ${error.message}`);
        throw error;
    }
}

async function uploadImage(file, progressElement) {
    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return null;
    }

    progressElement.style.display = 'block';
    progressElement.value = 0;

    try {
        const { data: uploadData } = await fetchApi('/upload', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name })
        });

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadData.signedUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    progressElement.value = (event.loaded / event.total) * 100;
                }
            };

            xhr.onload = () => {
                progressElement.style.display = 'none';
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(uploadData.key);
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(file);
        });
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}

async function deleteR2Image(key) {
    try {
        await fetchApi('/upload', {
            method: 'DELETE',
            body: JSON.stringify({ key })
        });
        return true;
    } catch (error) {
        console.error('Delete failed:', error);
        return false;
    }
}

function updateView() {
    const isLoggedIn = !!sessionToken;
    document.getElementById('admin-view').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('public-view').style.display = isLoggedIn ? 'none' : 'block';
    
    if (isLoggedIn) {
        loadAdminPosts();
        loadAdminFeatured();
        resetAuthTimer();
    } else {
        loadPublicPosts();
        loadPublicFeatured();
    }
    clearPostForm();
}

async function loadPublicPosts() {
    try {
        const { data: posts } = await fetchApi('/posts', { method: 'GET', excludeAuth: true });
        publicPostsListEl.innerHTML = posts.length ? posts.map(post => `
            <article class="post-item-public">
                <h3>${post.title.replace(/</g, '&lt;')}</h3>
                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-image-public">` : ''}
                <div class="post-content-public">${post.content}</div>
                <p><small>Posted: ${new Date(post.created_at).toLocaleDateString()}</small></p>
            </article>
        `).join('') : '<p>No posts available</p>';
    } catch (err) {
        publicPostsListEl.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    }
}

async function loadPublicFeatured() {
    try {
        const { data: featured } = await fetchApi('/featured', { method: 'GET', excludeAuth: true });
        publicFeaturedContentEl.innerHTML = `
            <p>${featured.text.replace(/</g, '&lt;')}</p>
            ${featured.youtubeUrl ? createYouTubeEmbed(featured.youtubeUrl) : ''}
        `;
    } catch (err) {
        publicFeaturedContentEl.innerHTML = `<p>Error loading featured content: ${err.message}</p>`;
    }
}

async function loadAdminPosts() {
    try {
        const { data: posts } = await fetchApi('/posts');
        adminPostsListEl.innerHTML = posts.length ? posts.map(post => `
            <div class="post-item-admin" data-post-id="${post.id}">
                <strong>${post.title.replace(/</g, '&lt;')}</strong>
                <p>${post.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
                ${post.image_url ? `<p><small>Image: ${post.image_url.split('/').pop()}</small></p>` : ''}
                <div class="post-actions">
                    <button class="edit-btn" data-post-id="${post.id}">Edit</button>
                    <button class="delete-btn" data-post-id="${post.id}">Delete</button>
                </div>
            </div>
        `).join('') : '<p>No posts created</p>';
    } catch (err) {
        adminPostsListEl.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    }
}

async function loadAdminFeatured() {
    try {
        const { data: featured } = await fetchApi('/featured');
        currentFeaturedTextEl.textContent = featured.text || 'No text set';
        featuredTextEl.value = featured.text || '';
        youtubeUrlInput.value = featured.youtubeUrl || '';
        currentFeaturedYoutubeEl.textContent = featured.youtubeUrl || 'No video URL set';
        currentFeaturedPreviewEl.innerHTML = featured.youtubeUrl ? createYouTubeEmbed(featured.youtubeUrl) : '';
    } catch (err) {
        currentFeaturedTextEl.textContent = `Error loading: ${err.message}`;
    }
}

function clearPostForm() {
    postForm.reset();
    postIdInput.value = '';
    postEditor.root.innerHTML = '';
    postImagePreviewEl.style.display = 'none';
    postImageUrlInput.value = '';
    postImageUrlDisplayEl.textContent = '';
    removePostImageBtn.style.display = 'none';
    formHeadingEl.textContent = 'Create New Post';
    submitPostBtn.textContent = 'Submit Post';
    cancelEditBtn.style.display = 'none';
}

postImageUploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            postImagePreviewEl.src = event.target.result;
            postImagePreviewEl.style.display = 'block';
            postImageUrlDisplayEl.textContent = file.name;
            removePostImageBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    }
});

removePostImageBtn.addEventListener('click', async () => {
    if (postImageUrlInput.value) {
        if (confirm('Delete current image?')) {
            await deleteR2Image(postImageUrlInput.value);
        }
    }
    postImageUploadInput.value = '';
    postImagePreviewEl.src = '';
    postImagePreviewEl.style.display = 'none';
    postImageUrlInput.value = '';
    postImageUrlDisplayEl.textContent = '';
    removePostImageBtn.style.display = 'none';
});

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitPostBtn.disabled = true;

    const postData = {
        title: postTitleEl.value.trim(),
        content: postEditor.root.innerHTML,
        imageUrl: postImageUrlInput.value || null
    };

    if (postIdInput.value) postData.id = parseInt(postIdInput.value, 10);

    try {
        if (postImageUploadInput.files[0]) {
            const newKey = await uploadImage(postImageUploadInput.files[0], postUploadProgressEl);
            postData.imageUrl = newKey;
        }

        const method = postIdInput.value ? 'PUT' : 'POST';
        await fetchApi('/posts', {
            method,
            body: JSON.stringify(postData)
        });

        alert(`Post ${postIdInput.value ? 'updated' : 'created'} successfully!`);
        clearPostForm();
        loadAdminPosts();
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        submitPostBtn.disabled = false;
    }
});

featuredForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = featuredForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        await fetchApi('/featured', {
            method: 'POST',
            body: JSON.stringify({
                text: featuredTextEl.value.trim(),
                youtubeUrl: youtubeUrlInput.value.trim() || null
            })
        });
        alert('Featured section updated!');
        loadAdminFeatured();
        loadPublicFeatured();
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        submitButton.disabled = false;
    }
});

loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
    loginPasswordEl.focus();
});

cancelLoginBtn.addEventListener('click', () => {
    loginModal.classList.remove('active');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorEl.style.display = 'none';

    try {
        const { data } = await fetchApi('/login', {
            method: 'POST',
            body: JSON.stringify({ password: loginPasswordEl.value }),
            excludeAuth: true
        });
        
        sessionStorage.setItem("sessionToken", data.sessionToken);
        sessionToken = data.sessionToken;
        loginModal.classList.remove('active');
        updateView();
    } catch (err) {
        loginErrorEl.textContent = err.status === 429 ? 
            'Too many attempts' : 
            `Login failed: ${err.message}`;
        loginErrorEl.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', handleLogout);

adminPostsListEl.addEventListener('click', async (e) => {
    const postId = e.target.dataset?.postId;
    if (e.target.classList.contains('delete-btn')) {
        if (confirm('Delete this post?')) {
            try {
                await fetchApi('/posts', {
                    method: 'DELETE',
                    body: JSON.stringify({ id: parseInt(postId, 10) })
                });
                loadAdminPosts();
            } catch (err) {
                alert(`Delete failed: ${err.message}`);
            }
        }
    } else if (e.target.classList.contains('edit-btn')) {
        try {
            const { data: posts } = await fetchApi('/posts');
            const post = posts.find(p => p.id === parseInt(postId, 10));
            if (post) {
                postIdInput.value = post.id;
                postTitleEl.value = post.title;
                postEditor.root.innerHTML = post.content;
                postImageUrlInput.value = post.image_url || '';
                postImageUrlDisplayEl.textContent = post.image_url?.split('/').pop() || '';
                formHeadingEl.textContent = 'Edit Post';
                submitPostBtn.textContent = 'Update Post';
                cancelEditBtn.style.display = 'inline-block';
            }
        } catch (err) {
            alert(`Error loading post: ${err.message}`);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (loginModal.classList.contains('active') && 
            !e.target.closest('.modal-content') &&
            !e.target.closest('#login-btn')) {
            loginModal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal.classList.contains('active')) {
            loginModal.classList.remove('active');
        }
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        loginModal.classList.remove('active');
    });

    updateView();
});
