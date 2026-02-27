Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::FromArgb(20, 20, 30))

# Draw a rounded rect background
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(256, 256)),
    [System.Drawing.Color]::FromArgb(10, 10, 25),
    [System.Drawing.Color]::FromArgb(30, 30, 50)
)
$g.FillRectangle($bgBrush, 0, 0, 256, 256)

# Draw "MA" text in cyan
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 255, 222))
$font = New-Object System.Drawing.Font("Arial", 100, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, 256, 256)
$g.DrawString("MA", $font, $brush, $rect, $sf)

$g.Dispose()

# Save as ICO
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create("$PSScriptRoot\public\icon.ico")
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()

Write-Host "Icon created successfully!"
