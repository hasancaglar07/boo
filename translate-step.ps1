[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$c = [System.IO.File]::ReadAllText("C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts", [System.Text.Encoding]::UTF8)

# Replace category (unique context: preceded by summary with "fear." and followed by readTime)
$old = "Provides the simplest answer to the first-time user's fear.`",
    category: `"Baslangic`","
$new = "Provides the simplest answer to the first-time user's fear.`",
    category: `"Getting Started`","
# The above won't match due to Turkish chars. Let me use a different approach.

# Replace using IndexOf with the known position context
# Let's find the section by the slug we already replaced
$marker = "can-i-publish-a-book-without-knowing-how-to-write"
$idx = $c.IndexOf($marker)
Write-Host "Slug found at index: $idx"

# Find category after this slug
$categorySearch = $c.IndexOf("category:", $idx)
Write-Host "Category found at index: $categorySearch"
$categoryContext = $c.Substring($categorySearch, 50)
Write-Host "Category context: $categoryContext"

# Find intro after category
$introSearch = $c.IndexOf("intro:", $categorySearch)
$introContext = $c.Substring($introSearch, 80)
Write-Host "Intro context: $introContext"
