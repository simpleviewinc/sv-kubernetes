projects=(
	shared
	bi
	cms
	crm
	crm30
	dam
	mint
	# zerista
)
shared=(test dev qa staging live)
bi=(test dev qa live)
cms=(test dev qa staging live)
crm=(test dev qa staging live)
crm30=(test dev live)
dam=(test dev qa staging live)
mint=(test dev qa live)
# zerista=(test dev qa live)

for i in "${projects[@]}"; do
	p="sv-$i-231700"
	typeset -n ref="$i"
	
	# cluster loops
	for ii in "${ref[@]}"; do
		echo "Short: $i Project: $p Cluster: $ii"
		
		sv switchContext -c "$ii" -p "$i"
		kubectl create namespace devops
		kubectl apply -f /sv/containers/lacework
		
	done
done