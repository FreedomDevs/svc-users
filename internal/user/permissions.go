package user

import "strings"

const (
	PermUsersRead    int64 = 1 << 0
	PermUsersWrite   int64 = 1 << 1
	PermUsersDelete  int64 = 1 << 2
	PermUsersReadOne int64 = 1 << 3
)

var PermissionMap = map[string]int64{
	"users.read":    PermUsersRead,
	"users.write":   PermUsersWrite,
	"users.delete":  PermUsersDelete,
	"users.readone": PermUsersReadOne,
}

var Groups = map[string]int64{
	"Admin":     PermUsersRead | PermUsersWrite | PermUsersDelete | PermUsersReadOne,
	"Moderator": PermUsersRead | PermUsersWrite | PermUsersReadOne,
	"Default":   PermUsersReadOne,
}

func ResolvePermissions(perms []string) int64 {
	var mask int64
	for _, p := range perms {
		p = strings.TrimSpace(p)
		if bit, ok := PermissionMap[p]; ok {
			mask |= bit
		} else if group, ok := Groups[p]; ok {
			mask |= group
		}
	}
	return mask
}

func HasPermissions(userMask int64, required []string) bool {
	reqMask := ResolvePermissions(required)
	return userMask&reqMask == reqMask
}

func AddPermissions(userMask int64, perms []string) int64 {
	return userMask | ResolvePermissions(perms)
}

func RemovePermissions(userMask int64, perms []string) int64 {
	return userMask &^ ResolvePermissions(perms)
}

func PermissionsToAtomicStrings(current int64) []string {
	var result []string
	for name, mask := range PermissionMap {
		if current&mask != 0 {
			result = append(result, name)
		}
	}
	return result
}
