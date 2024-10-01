#!/bin/bash
# This script lists the user's available nodes in the cluster and their load using the SLURM CLI.

# Function to print an error message and exit
error_exit() {
    local error_message=$1
    echo "Error: $error_message"
    exit 1
}

# Function to check if the user exists
check_user_is_registered() {
    local username=$1
    local user_in_sacctmgr
    user_in_sacctmgr=$(sacctmgr show user "$username" --noheader)
    if [ -z "$user_in_sacctmgr" ]; then
        error_exit "User $username does not exist."
    fi
}

# Function to list all partitions QoS limits
list_partitions_qos_limits() {
    sacctmgr -P -r show qos format=Name,GrpTRES --noheader || error_exit "Failed to get partitions qos limits."
}

# Function to list all partitions load
list_all_partitions_load() {
    sinfo --Format="Partition:|,CPUsState:|,NodeList:|,Gres:|,GresUsed:" --noheader || error_exit "Failed to get node load information."
}

# Function to list user partitions
list_user_partitions() {
    local username=$1
    sacctmgr show assoc user="$username" format=partition -P --noheader || error_exit "Failed to get user partitions."
}

# Function to list all partitions QoS
list_all_partitions_qos() {
    scontrol show partition --oneliner || error_exit "Failed to get partitions qos information."
}

# Function to format grep list
format_grep_list() {
    local list=$1
    local grep_list=""
    local partition
    while IFS= read -r partition; do
        grep_list+="$partition|"
    done <<<"$list"
    # Remove the trailing '|'
    grep_list=${grep_list%|}
    echo "$grep_list"
}

# Function to format partition qos
parse_partition_qos() {
    local partition_qos=$1
    local partition_name
    local qos
    IFS=' ' read -r -a properties <<<"$partition_qos"
    for property in "${properties[@]}"; do
        IFS='=' read -r key value <<<"$property"
        case $key in
        PartitionName)
            partition_name=$value
            ;;
        QoS)
            qos=$value
            ;;
        esac
    done
    echo "$partition_name|$qos"
}

# Function to parse CPU state
parse_cpus_state() {
    local cpus_state=$1
    IFS='/' read -r allocated idle other total <<<"$cpus_state"
    local json_output
    json_output="{"
    json_output+="\"allocated\":\"$allocated\","
    json_output+="\"idle\":\"$idle\","
    json_output+="\"other\":\"$other\","
    json_output+="\"total\":\"$total\""
    json_output+="}"
    echo "$json_output"
}

parse_qos() {
    local input_string="$1"
    local cpu="null"
    local gpu="null"
    local mem="null"

    # Check if the input string is empty
    if [[ -z "$input_string" ]]; then
        # Construct the JSON object
        json_output="{"
        json_output+="\"cpu\":\"$cpu\","
        json_output+="\"gpu\":\"$gpu\","
        json_output+="\"mem\":\"$mem\""
        json_output+="}"

        # Print the JSON object
        echo "$json_output"
        return
    fi

    # Split the string by commas and process each key-value pair
    IFS=',' read -ra kv_pairs <<<"$input_string"
    for kv in "${kv_pairs[@]}"; do
        IFS='=' read -r key value <<<"$kv"
        case "$key" in
        "cpu")
            cpu="$value"
            ;;
        "gres/gpu")
            gpu="$value"
            ;;
        "mem")
            mem="$value"
            ;;
        esac
    done

    # Construct the JSON object
    json_output="{"
    json_output+="\"cpu\":\"$cpu\","
    json_output+="\"gpu\":\"$gpu\","
    json_output+="\"mem\":\"$mem\""
    json_output+="}"

    # Print the JSON object
    echo "$json_output"
}

# Main function to combine partition data
combine_partition_data() {
    local username=$1

    # Get the data from the functions
    local qos_limits_list=$(list_partitions_qos_limits)
    local partitions_load=$(list_all_partitions_load)
    local user_partitions=$(list_user_partitions "$username")
    local partitions_qos=$(list_all_partitions_qos)

    # Convert user_partitions to a grep list
    local user_partitions_grep_list
    user_partitions_grep_list=$(format_grep_list "$user_partitions")

    # Filter partitions_qos by user_partitions
    local filtered_partitions_qos=$(echo "$partitions_qos" | grep -E "$user_partitions_grep_list")

    # if user_partitions is empty, set it to all partitions
    if [ -z "$user_partitions" ]; then
        user_partitions=$(echo "$partitions_load" | cut -d'|' -f1)
    fi

    # format start of the JSON output
    local json_complete_output=""
    json_complete_output+="{"
    json_complete_output+="\"username\":\"$username\","
    json_complete_output+="\"partitions\":"

    # Start the partitions array output
    local partitions_array_output=""
    partitions_array_output+="["
    # Process each user partition
    while IFS= read -r user_partition; do
        local partition_json_output=""
        local qos=""
        local qos_limits=""
        local load=""
        local node_list=""
        local gres_total=""
        local gres_used=""

        # Get QoS for the partition
        while IFS= read -r partition_qos; do
            parsed_qos=$(parse_partition_qos "$partition_qos")
            IFS='|' read -r partition qos_name <<<"$parsed_qos"
            if [[ "$partition" == "$user_partition" ]]; then
                qos="$qos_name"
                break
            fi
        done <<<"$filtered_partitions_qos"

        # Get QoS limits for the partition
        while IFS='|' read -r qos_name limits; do
            if [[ "$qos_name" == "$qos" ]]; then
                # formatting limits
                qos_limits=$(parse_qos "$limits")
                break
            fi
        done <<<"$qos_limits_list"

        if [[ -z "$qos_limits" ]]; then
            qos_limits=$(parse_qos "")
        fi

        # Get load for the partition
        while IFS='|' read -r partition cpus_state node_list gres_total gres_used; do
            if [[ "$partition" == "$user_partition" ]]; then
                load=$(parse_cpus_state "$cpus_state")
                break
            fi
        done <<<"$partitions_load"
        # Format and display the combined data
        local formatted_gres_total
        local formatted_gres_used
        if [[ -n "$gres_total" ]]; then
            formatted_gres_total=$(echo "$gres_total" | sed -e 's/gpu://g')
        else
            formatted_gres_total=""
        fi

        if [[ -n "$gres_used" ]]; then
            formatted_gres_used=$(echo "$gres_used" | sed -e 's/gpu://g')
        else
            formatted_gres_used=""
        fi

        # Manually format and display the combined data as JSON
        partition_json_output="{"
        partition_json_output+="\"partitionName\":\"$user_partition\","
        partition_json_output+="\"qos\":\"$qos\","
        partition_json_output+="\"nodeList\":\"$node_list\","
        partition_json_output+="\"cpusState\":$load,"
        partition_json_output+="\"gresTotal\":\"$formatted_gres_total\","
        partition_json_output+="\"gresUsed\":\"$formatted_gres_used\","
        partition_json_output+="\"groupQoSLimit\":$qos_limits"
        partition_json_output+="}"
        # Add the partition JSON output to the partitions array output with a comma
        partitions_array_output+="$partition_json_output,"
    done <<<"$user_partitions"
    # format end of the JSON output
    # remove last comma and
    partitions_array_output="${partitions_array_output%,}"
    # close the JSON array
    partitions_array_output+="]"
    # Add the partitions array output to the complete JSON output
    json_complete_output+="$partitions_array_output"
    # close the JSON output
    json_complete_output+="}"
    # Print the complete JSON output
    echo "$json_complete_output"
}

# Main function
main() {
    local username=${1:-}
    if [ -z "$username" ]; then
        echo "Missing username argument."
        exit 1
    fi
    check_user_is_registered "$username"

    combine_partition_data "$username"
    exit 0
}

# Exit on error, undefined variable, or error in pipeline
set -euo pipefail
# Execute the main function
export USERNAME=${INPUT_USERNAME}
main "$USERNAME"