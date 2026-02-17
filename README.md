# Three.js 跑酷游戏

一个可在 Windows 浏览器运行的 Three.js 跑酷小游戏。

## 控制方式

- `W / S / A / D`：移动
- `J`：跳跃
- `K`：下蹲
- `L`：空中冲刺（仅在空中可触发一次）
- `R`：失败后重开

## 运行

直接双击 `index.html` 可能会被浏览器的模块安全策略拦截，建议使用本地静态服务器。

### Python（Windows）

```powershell
cd run-game
py -m http.server 8000
```

打开 <http://localhost:8000> 即可游玩。
