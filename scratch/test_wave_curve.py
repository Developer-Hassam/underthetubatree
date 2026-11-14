def bezier(p0, p1, p2, p3, t):
    return (1-t)**3 * p0 + 3*(1-t)**2 * t * p1 + 3*(1-t) * t**2 * p2 + t**3 * p3

# Single bezier: (0, 36) -> (1440, 40) with controls (480, 72) and (960, 18)
pts = []
for i in range(11):
    t = i / 10.0
    x = bezier(0, 480, 960, 1440, t)
    y = bezier(36, 72, 18, 40, t)
    pts.append((round(x, 1), round(y, 1)))

print("Gentle rolling wave points (x, y):")
for p in pts:
    print(p)
