import { useState, useEffect } from 'react'
import './App.css'

type AttackType = 'heavy' | 'medium' | 'light'
type Explosion = { id: number; x: number; y: number }

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState(() => {
    // Initialize from localStorage or empty string
    return localStorage.getItem('playerName') || ''
  })
  const [playerHP, setPlayerHP] = useState(10)
  const [enemyHP, setEnemyHP] = useState(10)
  const [showAttackButtons, setShowAttackButtons] = useState(true)
  const [clickCount, setClickCount] = useState(0)
  const [isBlocking, setIsBlocking] = useState(false)
  const [gameMessage, setGameMessage] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)
  const [level, setLevel] = useState(1)
  const [blockPower, setBlockPower] = useState(0)
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [playerShake, setPlayerShake] = useState(false)
  const [enemyShake, setEnemyShake] = useState(false)
  const [playerHeal, setPlayerHeal] = useState(false)

  // Save player name to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('playerName', playerName)
  }, [playerName])

  useEffect(() => {
    if (playerHP <= 0) {
      setGameOver(true)
      setWinner('enemy')
    } else if (enemyHP <= 0) {
      if (level === 1) {
        // Progress to next level
        setLevel(2)
        setEnemyHP(15) // More HP for level 2
        setGameMessage('Level 2 - Enemy is stronger!')
        setShowAttackButtons(true)
      } else {
        setGameOver(true)
        setWinner('player')
      }
    }
  }, [playerHP, enemyHP, level])

  useEffect(() => {
    if (clickCount >= 20) {
      setIsBlocking(true)
      if (blockPower > 0) {
        setGameMessage(`Blocking activated! Can block ${blockPower} damage!`)
      }
    }
  }, [clickCount, blockPower])

  const createExplosion = (x: number, y: number) => {
    const newExplosion = { id: Date.now(), x, y }
    setExplosions(prev => [...prev, newExplosion])
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== newExplosion.id))
    }, 1000)
  }

  const handleAttack = (type: AttackType) => {
    let damage = 0
    setShowAttackButtons(false)
    
    // Create explosion effect on enemy side
    createExplosion(window.innerWidth * 0.8, window.innerHeight * 0.5)
    
    // Trigger enemy shake animation
    setEnemyShake(true)
    setTimeout(() => setEnemyShake(false), 500)
    
    switch(type) {
      case 'heavy':
        damage = 5
        setBlockPower(0)
        setGameMessage('Heavy attack! No blocking power.')
        break
      case 'medium':
        damage = 4
        setBlockPower(3)
        setGameMessage('Medium attack! Can block 3 damage.')
        break
      case 'light':
        damage = 3
        setBlockPower(0)
        setPlayerHP(10) // Heal to full
        setPlayerHeal(true)
        setTimeout(() => setPlayerHeal(false), 1000)
        setGameMessage('Light attack! Full heal but no blocking.')
        break
    }

    // Player attacks
    setEnemyHP(prev => Math.max(0, prev - damage))
    
    // Reset click count after attack
    setClickCount(0)
    setIsBlocking(false)

    // Enemy counter-attack after 1 second
    setTimeout(() => {
      const enemyDamage = level === 1 ? 5 : 7 // More damage in level 2
      
      // Create explosion effect on player side for enemy attack
      if (!isBlocking) {
        createExplosion(window.innerWidth * 0.2, window.innerHeight * 0.5)
        setPlayerShake(true)
        setTimeout(() => setPlayerShake(false), 500)
      }
      
      if (!isBlocking) {
        setPlayerHP(prev => Math.max(0, prev - enemyDamage))
        setGameMessage(`Enemy counter-attacked for ${enemyDamage} damage!`)
      } else {
        const blockedDamage = Math.min(blockPower, enemyDamage)
        const remainingDamage = enemyDamage - blockedDamage
        if (remainingDamage > 0) {
          setPlayerHP(prev => Math.max(0, prev - remainingDamage))
          setGameMessage(`Blocked ${blockedDamage} damage! Took ${remainingDamage} damage!`)
          createExplosion(window.innerWidth * 0.2, window.innerHeight * 0.5)
          setPlayerShake(true)
          setTimeout(() => setPlayerShake(false), 500)
        } else {
          setGameMessage('Blocked all damage!')
        }
      }
      setShowAttackButtons(true)
    }, 1000)
  }

  const handleSpamClick = () => {
    if (showAttackButtons && blockPower > 0) {
      setClickCount(prev => prev + 1)
    }
  }

  const handleRetry = () => {
    setPlayerHP(10)
    setEnemyHP(10)
    setGameOver(false)
    setWinner(null)
    setShowAttackButtons(true)
    setClickCount(0)
    setIsBlocking(false)
    setGameMessage('')
    setLevel(1)
    setBlockPower(0)
  }

  const handleReturnToLobby = () => {
    handleRetry()
    setGameStarted(false)
  }

  return (
    <div className="game-container">
      {explosions.map(explosion => (
        <div
          key={explosion.id}
          className="explosion"
          style={{
            left: explosion.x - 50,
            top: explosion.y - 50
          }}
        />
      ))}
      {!gameStarted ? (
        <div className="start-screen">
          <div className="title-box">WAR</div>
          <input
            type="text"
            className="name-input"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
          />
          <button 
            className="play-button"
            onClick={() => setGameStarted(true)}
            disabled={!playerName.trim()}
          >
            PLAY
          </button>
        </div>
      ) : (
        <div className="game-screen">
          {!gameOver ? (
            <>
              <div className="top-header">
                <div className="game-title">WAR</div>
                <div className="top-level-indicator">Level {level}</div>
              </div>
              <div className="player-side">
                <div className="character-container">
                  <div className="hp-container">
                    <div className="hp-text">HP: {playerHP}/10</div>
                    <div 
                      className="hp-bar" 
                      style={{ width: `${(playerHP / 10) * 100}%` }}
                    />
                  </div>
                  <div className={`player-box ${playerShake ? 'shake' : ''} ${playerHeal ? 'heal' : ''}`}>
                    <div className="character-info">
                      <div className="character-name">{playerName || 'Player'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="center-area" onClick={handleSpamClick}>
                {showAttackButtons && (
                  <div className="attack-buttons">
                    <button 
                      className="attack-button heavy"
                      onClick={() => handleAttack('heavy')}
                    >
                      <div className="attack-name-container">
                        <span className="attack-emoji">⚔️</span>
                        <span className="attack-title">PURE POWER</span>
                      </div>
                      <div className="attack-info">
                        <div className="attack-stats">⚔️ 5</div>
                      </div>
                    </button>
                    <button 
                      className="attack-button medium"
                      onClick={() => handleAttack('medium')}
                    >
                      <div className="attack-name-container">
                        <span className="attack-emoji">🛡️</span>
                        <span className="attack-title">BALANCED</span>
                      </div>
                      <div className="attack-info">
                        <div className="attack-stats">⚔️ 4</div>
                        <div className="attack-stats">🛡️ 3</div>
                      </div>
                    </button>
                    <button 
                      className="attack-button light"
                      onClick={() => handleAttack('light')}
                    >
                      <div className="attack-name-container">
                        <span className="attack-emoji">💚</span>
                        <span className="attack-title">SWIFT</span>
                      </div>
                      <div className="attack-info">
                        <div className="attack-stats">⚔️ 3</div>
                        <div className="attack-stats">❤️ FULL</div>
                      </div>
                    </button>
                  </div>
                )}
                <div className="game-message">{gameMessage}</div>
                {clickCount > 0 && blockPower > 0 && (
                  <div className="click-counter">Clicks: {clickCount}/20</div>
                )}
              </div>

              <div className="enemy-side">
                <div className="character-container">
                  <div className="hp-container">
                    <div className="hp-text">HP: {enemyHP}/{level === 1 ? 10 : 15}</div>
                    <div 
                      className="hp-bar" 
                      style={{ 
                        width: `${(enemyHP / (level === 1 ? 10 : 15)) * 100}%`,
                        background: 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)'
                      }}
                    />
                  </div>
                  <div className={`enemy-box ${enemyShake ? 'shake' : ''}`}>
                    <div className="character-info">
                      <div className="character-name">Enemy</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="game-over-screen">
              <div className="result-box">
                {winner === 'player' ? 'Victory!' : 'Defeat!'}
              </div>
              <div className="result-buttons">
                <button 
                  className="retry-button"
                  onClick={handleRetry}
                >
                  Retry
                </button>
                <button 
                  className="lobby-button"
                  onClick={handleReturnToLobby}
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
