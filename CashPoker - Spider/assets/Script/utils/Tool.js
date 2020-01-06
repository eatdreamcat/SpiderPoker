/**
 * 插件脚本，可以做一些拓展功能
 */
if (CC_DEBUG) {
  // console.log = function(...args) {};
  // console.warn = function(...args) {};
  // console.error = function(...args) {};
} else {
  console.log = function(...args) {};
  console.warn = function(...args) {};
  console.error = function(...args) {};
}
CMath = {};
CMath.Clamp = function(val, max, min) {
  return Math.max(Math.min(val, max), min);
};

CMath.Distance = function(p1, p2) {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  );
};

CMath.isInRange = function(val, min, max) {
  return val.x >= min.x && val.y >= min.y && val.x <= max.x && val.y <= max.y;
};

CMath.NumberFormat = function(val) {
  let strArr = val.toString().split(".");
  let strValArr = strArr[0].split("").reverse();
  let resStr = "";
  for (let i = 0; i < strValArr.length; i++) {
    resStr = strValArr[i] + resStr;
    if (i % 3 == 2 && i < strValArr.length - 1) {
      resStr = "," + resStr;
    }
  }

  if (strArr[1]) {
    resStr += "." + strArr[1];
  }

  return resStr;
};

CMath.TimeFormat = function(time) {
  let min = Math.floor(time / 60);
  //if (min < 10) min = "0" + min;
  let sec = Math.floor(time % 60);
  if (sec < 10) sec = "0" + sec;
  return min + "/" + sec;
};

/** 随机种子 */
CMath.randomSeed = 0;
CMath.sharedSeed = 0;

function seededRandom(seed, min, max) {
  const seed1 = (1711 * seed + 88888) % 302654;
  const seed2 = (1722 * seed + 55555) % 302665;
  const seed3 = (1755 * seed + 23333) % 302766;

  const rand =
    (((seed1 / 302654 + seed2 / 302665 + seed3 / 302766) * 1000000) % 1000000) /
    1000000;
  return min + rand * (max - min);
}

CMath.getRandom = function(min, max) {
  const seed = CMath.randomSeed;
  min = min || 0;
  max = max || 1;
  const result = seededRandom(seed, min, max);
  let step = Math.floor(seededRandom(seed, 1, 302766));
  CMath.randomSeed += step;

  return result;
};

CMath.GetWorldPosition = function(node) {
  if (!node || !node.getParent || !node.getParent()) return cc.v2(0, 0);
  let parent = node.getParent();
  return parent.convertToWorldSpaceAR(node.position);
};

CMath.ConvertToNodeSpaceAR = function(node, spaceNode) {
  if (!spaceNode) return cc.v2(0, 0);
  let worldPos = CMath.GetWorldPosition(node);
  return spaceNode.convertToNodeSpaceAR(worldPos);
};

CMath.CheckNumberBit = function(a, b) {
  if (a == b) return false;
  return (a | b) < a + b;
};

if (CC_DEBUG) {
  cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, event => {
    switch (event.keyCode) {
      case cc.macro.KEY.f11:
        if (cc.game.isPaused()) {
          cc.game.resume();
          console.log("------------------resume-----------------");
        } else {
          console.log("---------------------pause----------------------");
          cc.game.pause();
        }
        break;
      case cc.macro.KEY.f10:
        if (cc.game.isPaused()) {
          console.log(" -------------- step --------------------");
          cc.game.step();
        }
        break;
    }
  });
}

CHEAT_OPEN = CC_DEBUG;
