# Working with Quote Templates

This project supports custom HTML templates used when generating printable quotes or reports. These templates are stored either directly in the Supabase `templates` table or as JavaScript modules inside `src/components/QuoteTemplates/templates/`.

The easiest way to design these templates is by using Microsoft Word. You can lay out your page visually, insert images and tables, then export the result as HTML. After exporting, you can add dynamic placeholders such as `{{referenceNumber}}` that will be replaced at runtime.

## 1. Design the template in Word

1. Create a new document and build your layout.
2. Use Word features (tables, images, headings, etc.) to position all elements where you want them.
3. When you are happy with the layout, choose **File → Save As** and select **Web Page, Filtered** to export HTML.

Word may generate multiple files for images; keep the HTML file and any referenced assets together.

## 2. Insert placeholders

Open the exported HTML in a text editor and replace text where dynamic data should appear with Handlebars-style placeholders:

```html
<p>Quote Reference: {{referenceNumber}}</p>
<p>Customer Name: {{customerName}}</p>
```

Any field available in your application can be inserted using this `{{placeholder}}` syntax.

## 3. Upload the template

There are two ways to make the HTML template available to the app:

### Option A: Upload to Supabase

1. Sign in to your Supabase project and open the SQL editor.
2. Insert a new record in the `templates` table with a unique `name` and the full HTML in the `content` column:

```sql
insert into templates (name, content) values ('My New Template', '<!DOCTYPE html>...');
```

The application loads templates from this table so users can select them from the UI.

### Option B: Store in the repository

If you want the template bundled with the front-end code, place the HTML content in a JavaScript file under `src/components/QuoteTemplates/templates/`:

```javascript
export const myNewTemplate = {
  name: 'My New Template',
  content: `<!DOCTYPE html>
  <html>
    ...
  </html>`,
};
```

Templates defined in this folder are available without needing to query the database.

## 4. Test the template

Run `npm run dev` during development or `npm run build` for production to ensure the template renders correctly.
