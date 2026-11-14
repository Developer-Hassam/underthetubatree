def cubic(p0, p1, p2, p3, t):
    return (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3

# First curve: (0, 45) to (960, 52), controls (320, 70), (640, 22)
# Second curve: (960, 52) to (1440, 40), controls (1200, 68), (1360, 48)
pts = []
for i in range(11):
    t = i / 10.0
    x = cubic(0, 320, 640, 960, t)
    y = cubic(45, 70, 22, 52, t)
    pts.append((round(x, 1), round(y, 1)))

for i in range(1, 6):
    t = i / 5.0
    x = cubic(960, 1200, 1360, 1440, t)
    y = cubic(52, 68, 48, 40, t)
    pts.append((round(x, 1), round(y, 1)))

print("Two-lobe wave points (x, y):")
for p in pts:
    print(p)
