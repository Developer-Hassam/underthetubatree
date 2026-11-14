from PIL import Image

img = Image.open('assets/hero-bg.jpg')
w, h = img.size
print(f"hero-bg.jpg size: {w}x{h}")

# Sample along the bottom 10%
bottom_left = img.getpixel((10, h - 10))
bottom_center = img.getpixel((w // 2, h - 10))
bottom_right = img.getpixel((w - 10, h - 10))
y_above = h - 80

print(f"Bottom-left pixel: RGB{bottom_left} #{bottom_left[0]:02X}{bottom_left[1]:02X}{bottom_left[2]:02X}")
print(f"Bottom-center pixel: RGB{bottom_center} #{bottom_center[0]:02X}{bottom_center[1]:02X}{bottom_center[2]:02X}")
print(f"Bottom-right pixel: RGB{bottom_right} #{bottom_right[0]:02X}{bottom_right[1]:02X}{bottom_right[2]:02X}")

# Sample left edge gradient
print("\nLeft edge samples (from bottom to top):")
for y in [h - 10, h - 50, h - 100, h - 200, h - 400, h - 800]:
    p = img.getpixel((5, y))
    print(f"y={y}: RGB{p} #{p[0]:02X}{p[1]:02X}{p[2]:02X}")
