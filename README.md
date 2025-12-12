
## 🚀 Deployment to GitHub Pages

### Step 1: Replace Your Repository Files

1. Open your GitHub repository: https://github.com/pepinilla/Caro-flower-art
2. Delete the old `index.html` file
3. Upload all files from the enhanced version:
   - The new `index.html`
   - All image files (.webp)
   - This `README.md`

### Step 2: Enable GitHub Pages

1. Go to your repository settings
2. Scroll down to "GitHub Pages" section
3. Select "main" branch as the source
4. Your site will be published at: https://pepinilla.github.io/Caro-flower-art/

### Step 3: Verify Deployment

1. Wait 1-2 minutes for GitHub to build and deploy
2. Visit https://pepinilla.github.io/Caro-flower-art/
3. Check that all images load correctly
4. Test all interactive features

## 🛠️ Customization Guide

### Change Colors
Edit the CSS variables in the `<style>` section:

```css
:root {
  --primary-color: #e89aa6;      /* Main pink color */
  --secondary-color: #f5d75dc;   /* Light pink */
  --dark-color: #333;             /* Dark text */
  --light-color: #f9f9f9;         /* Light background */
}
```

### Update Contact Information
Find and replace in the HTML:
- **WhatsApp Number**: `573209781661` → Your number
- **Email**: `caroflowerart@example.com` → Your email
- **Instagram**: `@caroflowerart` → Your handle

### Add New Products
Copy this template and add it to the gallery section:

```html
<div class="card" data-category="wedding">
  <div class="card-image-wrapper">
    <img src="your-image.webp" alt="Description" loading="lazy">
    <span class="card-badge">Category</span>
  </div>
  <div class="card-content">
    <div class="category">Category</div>
    <h3>Product Name</h3>
    <p>Product description here.</p>
    <div class="card-footer">
      <a href="instagram-link" target="_blank">View on Instagram</a>
      <a href="#contact">Inquire</a>
    </div>
  </div>
</div>
```

### Update Testimonials
Find the testimonials section and modify the cards with your actual customer reviews.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ⚡ Performance Tips

1. **Image Optimization** - Images are already in WebP format (best for web)
2. **Lazy Loading** - Images load only when visible
3. **Minified CSS** - All CSS is inline for faster loading
4. **No External Dependencies** - Only uses Font Awesome for icons (CDN)

## 🔐 Security

- No sensitive data stored in the code
- Form submissions go directly to WhatsApp
- No external scripts except Font Awesome
- HTTPS enabled on GitHub Pages

## 📊 SEO Optimization

The website includes:
- Proper meta tags and descriptions
- Open Graph tags for social sharing
- Semantic HTML structure
- Mobile-friendly design
- Fast loading times

## 🎨 Design Features

### Color Palette
- **Primary**: #e89aa6 (Soft Pink)
- **Secondary**: #f5d5dc (Light Pink)
- **Dark**: #333 (Dark Gray)
- **Light**: #f9f9f9 (Off White)

### Typography
- **Headings**: Playfair Display (elegant serif)
- **Body**: Poppins (modern sans-serif)
- **Font Sizes**: Responsive and scalable

### Spacing & Layout
- **Grid System**: Auto-fit responsive grid
- **Padding**: Consistent spacing throughout
- **Margins**: Proper whitespace for readability

## 🔧 Maintenance

### Regular Updates
- Update product images as needed
- Keep testimonials current
- Update contact information if it changes
- Monitor for broken links

### Backup
- Keep a backup of your files
- Version control with Git
- Regular commits to GitHub

## 📞 Support & Customization

If you need further customization:
1. Edit the HTML directly in your repository
2. Make changes and commit
3. GitHub Pages will automatically update

## 📄 License

This website is created for Caro Flower Art. All rights reserved.
