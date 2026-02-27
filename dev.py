#!/usr/bin/env python3
import subprocess
import time
import curses

POSTGRES_CONTAINER = "my_postgres"
REDIS_CONTAINER = "my_redis"
REDIS_PASSWORD = "superSecret"


# =========================
# UTILS
# =========================

def run(cmd, check=True):
    """Запуск shell команды с обработкой Ctrl+C"""
    print(f"\n👉 {cmd}")
    try:
        result = subprocess.run(cmd, shell=True)
        if check and result.returncode != 0:
            print("❌ Command failed")
            return False
        return True
    except KeyboardInterrupt:
        print("\n❌ Interrupted by user")
        return False


def wait_for_postgres():
    print("⏳ Waiting for PostgreSQL...")
    for _ in range(40):
        if subprocess.run(
            f"docker exec {POSTGRES_CONTAINER} pg_isready -U postgres",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode == 0:
            print("✅ PostgreSQL is ready")
            return
        time.sleep(1)
    print("❌ PostgreSQL did not start in time")


def wait_for_redis():
    print("⏳ Waiting for Redis...")
    for _ in range(40):
        result = subprocess.run(
            f"docker exec {REDIS_CONTAINER} redis-cli -a {REDIS_PASSWORD} ping",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
        if b"PONG" in result.stdout:
            print("✅ Redis is ready")
            return
        time.sleep(1)
    print("❌ Redis did not start in time")


def prisma_migrate():
    print("🗄 Running Prisma migrations...")
    run("npx prisma migrate dev")


# =========================
# MODES
# =========================

def run_dev():
    try:
        run("docker compose up -d")
        wait_for_postgres()
        wait_for_redis()
        prisma_migrate()
        run("npm run start:dev", check=False)
    except KeyboardInterrupt:
        print("\n❌ Dev run interrupted")


def run_mid():
    try:
        print("⚡ MID mode (fast local run)")
        run("docker compose up -d")
        run("npm run start:dev", check=False)
    except KeyboardInterrupt:
        print("\n❌ MID run interrupted")


# =========================
# WRAPPER FOR TUI
# =========================

def run_mode(func):
    curses.endwin()
    try:
        func()
    except KeyboardInterrupt:
        print("\n❌ Interrupted by user")
    input("\nНажмите Enter для возврата в меню...")


# =========================
# TUI
# =========================

MENU = [
    ("DEV — full startup", run_dev),
    ("MID — fast local tests", run_mid),
    ("Exit", None),
]


def tui(stdscr):
    curses.curs_set(0)
    current = 0

    while True:
        stdscr.clear()
        stdscr.addstr(0, 0, "🚀 Select run mode\n", curses.A_BOLD)

        for i, (label, _) in enumerate(MENU):
            if i == current:
                stdscr.addstr(i + 2, 2, f"> {label}", curses.A_REVERSE)
            else:
                stdscr.addstr(i + 2, 2, f"  {label}")

        key = stdscr.getch()

        if key == curses.KEY_UP:
            current = (current - 1) % len(MENU)
        elif key == curses.KEY_DOWN:
            current = (current + 1) % len(MENU)
        elif key in (curses.KEY_ENTER, 10, 13):
            if MENU[current][1] is None:
                return
            run_mode(MENU[current][1])


def main():
    curses.wrapper(tui)


if __name__ == "__main__":
    main()
