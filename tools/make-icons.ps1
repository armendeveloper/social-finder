param([string]$OutDir)
Add-Type -AssemblyName System.Drawing

function Draw-Icon([int]$size, [string]$path, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  $s = $size / 512.0

  $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
  $c1 = [System.Drawing.ColorTranslator]::FromHtml('#6366F1')
  $c2 = [System.Drawing.ColorTranslator]::FromHtml('#9333EA')
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45.0

  if ($maskable) {
    # Full-bleed background; the artwork shrinks into the safe zone.
    $g.FillRectangle($brush, $rect)
    $k = 0.72
  } else {
    $r = 112 * $s
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc(0, 0, 2*$r, 2*$r, 180, 90)
    $p.AddArc($size-2*$r, 0, 2*$r, 2*$r, 270, 90)
    $p.AddArc($size-2*$r, $size-2*$r, 2*$r, 2*$r, 0, 90)
    $p.AddArc(0, $size-2*$r, 2*$r, 2*$r, 90, 90)
    $p.CloseFigure()
    $g.FillPath($brush, $p)
    $k = 1.0
  }

  # Map 512-unit artwork coordinates, scaled around the centre by $k.
  $off = (512 - 512*$k) / 2
  function T([double]$v) { return ($off + $v*$k) * $s }
  $u = $k * $s

  $white = [System.Drawing.Color]::White
  $pen = New-Object System.Drawing.Pen $white, (36*$u)
  $g.DrawEllipse($pen, (T 108), (T 108), (236*$u), (236*$u))
  $pen2 = New-Object System.Drawing.Pen $white, (44*$u)
  $pen2.StartCap = 'Round'; $pen2.EndCap = 'Round'
  $g.DrawLine($pen2, (T 312), (T 312), (T 402), (T 402))
  $wb = New-Object System.Drawing.SolidBrush $white
  $g.FillEllipse($wb, (T 190), (T 160), (72*$u), (72*$u))
  # Shoulders: top half of an ellipse.
  $g.FillPie($wb, (T 160), (T 232), (132*$u), (116*$u), 180, 180)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Draw-Icon 192 (Join-Path $OutDir 'icon-192.png') $false
Draw-Icon 512 (Join-Path $OutDir 'icon-512.png') $false
Draw-Icon 512 (Join-Path $OutDir 'icon-maskable-512.png') $true
"done"
